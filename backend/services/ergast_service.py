import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiohttp

from config import (
    CONSTRUCTOR_CACHE_TTL,
    ERGAST_BASE_URL,
    RACE_RESULTS_CACHE_TTL,
)
from cache.base_cache import BaseCache

log = logging.getLogger(__name__)


class ErgastService:
    def __init__(self, cache: BaseCache):
        self.cache = cache
        self._session: Optional[aiohttp.ClientSession] = None

    async def _ensure_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={"User-Agent": "f1-dashboard/0.1"},
            )
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    async def _get(self, path: str) -> Optional[Dict[str, Any]]:
        session = await self._ensure_session()
        url = f"{ERGAST_BASE_URL}{path}.json"
        try:
            async with session.get(url) as resp:
                if resp.status >= 400:
                    log.warning("Ergast GET %s status %s", url, resp.status)
                    return None
                return await resp.json()
        except Exception as e:
            log.warning("Ergast GET %s failed: %s", url, e)
            return None

    async def driver_standings(self, year: int) -> List[Dict[str, Any]]:
        cache_key = f"ergast:drivers:{year}"
        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached
        data = await self._get(f"/{year}/driverStandings")
        rows = _extract_driver_standings(data)
        if rows:
            await self.cache.set(cache_key, rows, CONSTRUCTOR_CACHE_TTL)
        return rows

    async def constructor_standings(self, year: int) -> List[Dict[str, Any]]:
        cache_key = f"ergast:constructors:{year}"
        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached
        data = await self._get(f"/{year}/constructorStandings")
        rows = _extract_constructor_standings(data)
        if rows:
            await self.cache.set(cache_key, rows, CONSTRUCTOR_CACHE_TTL)
        return rows

    async def last_race_results(self, year: int) -> Optional[Dict[str, Any]]:
        cache_key = f"ergast:lastrace:{year}"
        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached
        data = await self._get(f"/{year}/last/results")
        result = _extract_race_results(data)
        if result:
            await self.cache.set(cache_key, result, RACE_RESULTS_CACHE_TTL)
        return result

    async def last_qualifying(self, year: int) -> Optional[Dict[str, Any]]:
        cache_key = f"ergast:lastquali:{year}"
        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached
        data = await self._get(f"/{year}/last/qualifying")
        result = _extract_qualifying(data)
        if result:
            await self.cache.set(cache_key, result, RACE_RESULTS_CACHE_TTL)
        return result

    async def available_seasons(self) -> List[int]:
        cache_key = "ergast:seasons"
        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached
        years: List[int] = []
        for offset in (0, 100):
            data = await self._get(f"/seasons?limit=100&offset={offset}")
            try:
                rows = data["MRData"]["SeasonTable"]["Seasons"] if data else []
            except (KeyError, TypeError):
                rows = []
            for r in rows:
                try:
                    years.append(int(r.get("season")))
                except (ValueError, TypeError):
                    pass
            if len(rows) < 100:
                break
        years.sort(reverse=True)
        if years:
            await self.cache.set(cache_key, years, 86400)
        return years

    async def season_winners(self, year: int) -> List[Dict[str, Any]]:
        cache_key = f"ergast:winners:{year}"
        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached
        data = await self._get(f"/{year}/results/1?limit=30")
        rows: List[Dict[str, Any]] = []
        try:
            races = data["MRData"]["RaceTable"]["Races"] if data else []
        except (KeyError, TypeError):
            races = []
        for r in races:
            circuit = r.get("Circuit") or {}
            location = circuit.get("Location") or {}
            results = r.get("Results") or []
            winner = results[0] if results else {}
            driver = winner.get("Driver") or {}
            constructor = winner.get("Constructor") or {}
            rows.append(
                {
                    "round": int(r.get("round", 0)),
                    "race_name": r.get("raceName"),
                    "circuit": circuit.get("circuitName"),
                    "country": location.get("country"),
                    "date": r.get("date"),
                    "winner_full_name": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip() or None,
                    "winner_code": driver.get("code"),
                    "winner_constructor": constructor.get("name"),
                    "winner_time": (winner.get("Time") or {}).get("time"),
                }
            )
        rows.sort(key=lambda x: x.get("round") or 0)
        if rows:
            await self.cache.set(cache_key, rows, 3600)
        return rows

    async def all_season_results(self, year: int) -> List[Dict[str, Any]]:
        """Per-round constructor points for the line chart.

        Ergast caps `limit` at 100, so for a 22-round season (~440 rows)
        we paginate. We collect races by round number and merge as we go.
        """
        cache_key = f"ergast:allresults:{year}"
        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached

        races_by_round: Dict[int, Dict[str, Any]] = {}
        offset = 0
        page_size = 100
        for _ in range(20):  # hard cap to avoid infinite loops
            data = await self._get(
                f"/{year}/results?limit={page_size}&offset={offset}"
            )
            try:
                mrdata = data["MRData"] if data else {}
                page_races = mrdata["RaceTable"]["Races"]
                total = int(mrdata.get("total") or 0)
            except (KeyError, TypeError, ValueError):
                break
            if not page_races:
                break
            for r in page_races:
                rd = int(r.get("round", 0))
                if rd not in races_by_round:
                    races_by_round[rd] = {**r, "Results": []}
                races_by_round[rd]["Results"].extend(r.get("Results") or [])
            offset += page_size
            if offset >= total:
                break
        races = [races_by_round[k] for k in sorted(races_by_round.keys())]
        rounds: List[Dict[str, Any]] = []
        for r in races:
            results = r.get("Results") or []
            row = {
                "round": int(r.get("round", 0)),
                "race_name": r.get("raceName"),
                "country": ((r.get("Circuit") or {}).get("Location") or {}).get("country"),
                "date": r.get("date"),
                "constructor_points": {},
                "constructor_wins": {},
                "constructor_podiums": {},
            }
            for res in results:
                constructor = (res.get("Constructor") or {}).get("name")
                if not constructor:
                    continue
                try:
                    pts = float(res.get("points") or 0)
                except (ValueError, TypeError):
                    pts = 0.0
                row["constructor_points"][constructor] = (
                    row["constructor_points"].get(constructor, 0.0) + pts
                )
                try:
                    position = int(res.get("position") or 0)
                except (ValueError, TypeError):
                    position = 0
                if position == 1:
                    row["constructor_wins"][constructor] = 1
                if 1 <= position <= 3:
                    row["constructor_podiums"][constructor] = (
                        row["constructor_podiums"].get(constructor, 0) + 1
                    )
            rounds.append(row)
        rounds.sort(key=lambda x: x.get("round") or 0)
        # 1 hour: short enough that a new race result appears the same day
        if rounds:
            await self.cache.set(cache_key, rounds, 3600)
        return rounds

    async def season_schedule(self, year: int) -> List[Dict[str, Any]]:
        cache_key = f"ergast:schedule:{year}"
        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached
        data = await self._get(f"/{year}")
        rows = _extract_schedule(data)
        if rows:
            await self.cache.set(cache_key, rows, RACE_RESULTS_CACHE_TTL)
        return rows


def _extract_driver_standings(data: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not data:
        return []
    try:
        lists = data["MRData"]["StandingsTable"]["StandingsLists"]
        if not lists:
            return []
        rows = []
        for r in lists[0].get("DriverStandings", []):
            driver = r.get("Driver", {})
            constructors = r.get("Constructors", [])
            team = constructors[0].get("name") if constructors else None
            rows.append(
                {
                    "position": int(r.get("position", 0)),
                    "driver_code": driver.get("code"),
                    "driver_number": int(driver.get("permanentNumber")) if driver.get("permanentNumber") else None,
                    "full_name": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                    "team_name": team,
                    "points": float(r.get("points", 0)),
                    "wins": int(r.get("wins", 0)),
                }
            )
        return rows
    except (KeyError, TypeError, ValueError) as e:
        log.warning("ergast driver parse failed: %s", e)
        return []


def _extract_constructor_standings(data: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not data:
        return []
    try:
        lists = data["MRData"]["StandingsTable"]["StandingsLists"]
        if not lists:
            return []
        rows = []
        for r in lists[0].get("ConstructorStandings", []):
            constructor = r.get("Constructor", {})
            rows.append(
                {
                    "position": int(r.get("position", 0)),
                    "team_name": constructor.get("name"),
                    "nationality": constructor.get("nationality"),
                    "points": float(r.get("points", 0)),
                    "wins": int(r.get("wins", 0)),
                }
            )
        return rows
    except (KeyError, TypeError, ValueError) as e:
        log.warning("ergast constructor parse failed: %s", e)
        return []


def _combine_date_time(date: Optional[str], time: Optional[str]) -> Optional[str]:
    if not date:
        return None
    if not time:
        return f"{date}T00:00:00Z"
    return f"{date}T{time}"


def _extract_schedule(data: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not data:
        return []
    try:
        races = data["MRData"]["RaceTable"]["Races"]
        out = []
        for r in races:
            circuit = r.get("Circuit") or {}
            location = circuit.get("Location") or {}
            sessions = {
                "fp1": _combine_date_time((r.get("FirstPractice") or {}).get("date"), (r.get("FirstPractice") or {}).get("time")),
                "fp2": _combine_date_time((r.get("SecondPractice") or {}).get("date"), (r.get("SecondPractice") or {}).get("time")),
                "fp3": _combine_date_time((r.get("ThirdPractice") or {}).get("date"), (r.get("ThirdPractice") or {}).get("time")),
                "qualifying": _combine_date_time((r.get("Qualifying") or {}).get("date"), (r.get("Qualifying") or {}).get("time")),
                "sprint": _combine_date_time((r.get("Sprint") or {}).get("date"), (r.get("Sprint") or {}).get("time")),
                "race": _combine_date_time(r.get("date"), r.get("time")),
            }
            out.append(
                {
                    "round": int(r.get("round", 0)),
                    "race_name": r.get("raceName"),
                    "circuit_name": circuit.get("circuitName"),
                    "circuit_id": circuit.get("circuitId"),
                    "country": location.get("country"),
                    "locality": location.get("locality"),
                    "date": r.get("date"),
                    "time": r.get("time"),
                    "race_start": sessions["race"],
                    "sessions": sessions,
                }
            )
        return out
    except (KeyError, TypeError, ValueError) as e:
        log.warning("ergast schedule parse failed: %s", e)
        return []


def _parse_qtime(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    try:
        if ":" in s:
            mins, rest = s.split(":", 1)
            return int(mins) * 60 + float(rest)
        return float(s)
    except (ValueError, TypeError):
        return None


def _extract_qualifying(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not data:
        return None
    try:
        races = data["MRData"]["RaceTable"]["Races"]
        if not races:
            return None
        race = races[0]
        results = []
        for r in race.get("QualifyingResults", []):
            driver = r.get("Driver", {})
            constructor = r.get("Constructor", {})
            q1 = r.get("Q1")
            q2 = r.get("Q2")
            q3 = r.get("Q3")
            results.append(
                {
                    "position": int(r.get("position", 0)),
                    "driver_code": driver.get("code"),
                    "driver_number": int(driver.get("permanentNumber")) if driver.get("permanentNumber") else None,
                    "full_name": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                    "team_name": constructor.get("name"),
                    "q1": q1,
                    "q2": q2,
                    "q3": q3,
                    "q1_seconds": _parse_qtime(q1),
                    "q2_seconds": _parse_qtime(q2),
                    "q3_seconds": _parse_qtime(q3),
                }
            )
        return {
            "race_name": race.get("raceName"),
            "circuit": (race.get("Circuit") or {}).get("circuitName"),
            "country": ((race.get("Circuit") or {}).get("Location") or {}).get("country"),
            "date": race.get("date"),
            "results": results,
        }
    except (KeyError, TypeError, ValueError) as e:
        log.warning("ergast qualifying parse failed: %s", e)
        return None


def _extract_race_results(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not data:
        return None
    try:
        races = data["MRData"]["RaceTable"]["Races"]
        if not races:
            return None
        race = races[0]
        results = []
        for r in race.get("Results", []):
            driver = r.get("Driver", {})
            constructor = r.get("Constructor", {})
            results.append(
                {
                    "position": int(r.get("position", 0)),
                    "driver_code": driver.get("code"),
                    "full_name": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                    "team_name": constructor.get("name"),
                    "points": float(r.get("points", 0)),
                    "status": r.get("status"),
                    "time": (r.get("Time") or {}).get("time"),
                }
            )
        return {
            "race_name": race.get("raceName"),
            "circuit": (race.get("Circuit") or {}).get("circuitName"),
            "country": ((race.get("Circuit") or {}).get("Location") or {}).get("country"),
            "date": race.get("date"),
            "results": results,
        }
    except (KeyError, TypeError, ValueError) as e:
        log.warning("ergast race parse failed: %s", e)
        return None
