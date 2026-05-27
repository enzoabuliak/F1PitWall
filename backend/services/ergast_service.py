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
