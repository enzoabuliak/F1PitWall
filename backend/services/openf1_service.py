import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiohttp

from config import (
    OPENF1_BASE_URL,
    SESSION_POLL_INTERVAL,
    TIMING_CACHE_TTL,
    TIMING_POLL_INTERVAL,
    TELEMETRY_CACHE_TTL,
    WEATHER_CACHE_TTL,
    DRIVER_INFO_CACHE_TTL,
)
from cache.base_cache import BaseCache

log = logging.getLogger(__name__)


def _compute_session_status(date_start: Optional[str], date_end: Optional[str]) -> str:
    if not date_start:
        return "unknown"
    try:
        start = datetime.fromisoformat(date_start.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return "unknown"
    now = datetime.now(timezone.utc)
    if now < start:
        return "upcoming"
    if date_end:
        try:
            end = datetime.fromisoformat(date_end.replace("Z", "+00:00"))
            if now <= end:
                return "live"
            return "finished"
        except (ValueError, TypeError):
            pass
    if (now - start).total_seconds() < 7200:
        return "live"
    return "finished"


class OpenF1Service:
    def __init__(self, cache: BaseCache):
        self.cache = cache
        self._session: Optional[aiohttp.ClientSession] = None
        self._current_session_key: Optional[int] = None
        self._backoff = 1.0

    async def _ensure_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=60),
                headers={"User-Agent": "f1-dashboard/0.1"},
            )
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    async def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        session = await self._ensure_session()
        url = f"{OPENF1_BASE_URL}{path}"
        try:
            async with session.get(url, params=params) as resp:
                if resp.status == 429:
                    await asyncio.sleep(self._backoff)
                    self._backoff = min(self._backoff * 2, 30.0)
                    return []
                resp.raise_for_status()
                self._backoff = 1.0
                return await resp.json()
        except Exception as e:
            log.warning("OpenF1 GET %s failed: %s", url, e)
            return []

    async def get_latest_session(self) -> Optional[Dict[str, Any]]:
        data = await self._get("/sessions", params={"session_key": "latest"})
        return data[0] if data else None

    async def get_drivers(self, session_key: int) -> List[Dict[str, Any]]:
        return await self._get("/drivers", params={"session_key": session_key})

    async def get_positions(self, session_key: int) -> List[Dict[str, Any]]:
        return await self._get("/position", params={"session_key": session_key})

    async def get_intervals(self, session_key: int) -> List[Dict[str, Any]]:
        return await self._get("/intervals", params={"session_key": session_key})

    async def get_laps(self, session_key: int) -> List[Dict[str, Any]]:
        return await self._get("/laps", params={"session_key": session_key})

    async def get_weather(self, session_key: int) -> List[Dict[str, Any]]:
        return await self._get("/weather", params={"session_key": session_key})

    async def get_car_data(self, session_key: int, driver_number: int) -> List[Dict[str, Any]]:
        return await self._get(
            "/car_data",
            params={"session_key": session_key, "driver_number": driver_number},
        )

    async def get_stints(self, session_key: int) -> List[Dict[str, Any]]:
        return await self._get("/stints", params={"session_key": session_key})

    async def _refresh_session(self) -> None:
        session = await self.get_latest_session()
        if not session:
            return
        self._current_session_key = session.get("session_key")
        date_start = session.get("date_start")
        date_end = session.get("date_end")
        session_status = _compute_session_status(date_start, date_end)
        year = session.get("year")
        if year is None and date_start:
            try:
                year = int(date_start[:4])
            except (ValueError, TypeError):
                year = None
        race_state = {
            "session_key": session.get("session_key"),
            "meeting_key": session.get("meeting_key"),
            "session_name": session.get("session_name"),
            "session_type": session.get("session_type"),
            "country": session.get("country_name"),
            "circuit": session.get("circuit_short_name"),
            "date_start": date_start,
            "date_end": date_end,
            "year": year,
            "status": "active",
            "session_status": session_status,
        }
        await self.cache.set("race:state", race_state, WEATHER_CACHE_TTL)

        drivers = await self.get_drivers(self._current_session_key)
        driver_map = {d["driver_number"]: d for d in drivers}
        await self.cache.set("drivers:map", driver_map, DRIVER_INFO_CACHE_TTL)

    async def _refresh_timing(self) -> None:
        if not self._current_session_key:
            return
        sk = self._current_session_key
        positions = await self.get_positions(sk)
        intervals = await self.get_intervals(sk)
        laps = await self.get_laps(sk)
        stints = await self.get_stints(sk)

        latest_pos: Dict[int, Dict[str, Any]] = {}
        for p in positions:
            dn = p.get("driver_number")
            if dn is not None:
                latest_pos[dn] = p

        latest_int: Dict[int, Dict[str, Any]] = {}
        for i in intervals:
            dn = i.get("driver_number")
            if dn is not None:
                latest_int[dn] = i

        latest_lap: Dict[int, Dict[str, Any]] = {}
        for lap in laps:
            dn = lap.get("driver_number")
            if dn is not None:
                latest_lap[dn] = lap

        latest_stint: Dict[int, Dict[str, Any]] = {}
        for s in stints:
            dn = s.get("driver_number")
            if dn is not None:
                latest_stint[dn] = s

        driver_map: Dict[int, Dict[str, Any]] = (await self.cache.get("drivers:map")) or {}

        snapshot: List[Dict[str, Any]] = []
        for dn, pos in latest_pos.items():
            info = driver_map.get(dn, {})
            interval = latest_int.get(dn, {})
            lap = latest_lap.get(dn, {})
            stint = latest_stint.get(dn, {})
            gap = interval.get("gap_to_leader")
            if isinstance(gap, str):
                try:
                    gap = float(gap.lstrip("+L"))
                except ValueError:
                    gap = None
            snapshot.append(
                {
                    "driver_number": dn,
                    "position": pos.get("position"),
                    "full_name": info.get("full_name"),
                    "team_name": info.get("team_name"),
                    "team_colour": info.get("team_colour"),
                    "gap_to_leader": gap,
                    "gap_to_next": interval.get("interval"),
                    "sector1_time": lap.get("duration_sector_1"),
                    "sector2_time": lap.get("duration_sector_2"),
                    "sector3_time": lap.get("duration_sector_3"),
                    "last_lap_time": lap.get("lap_duration"),
                    "tire_compound": stint.get("compound"),
                    "tire_age": stint.get("tyre_age_at_start"),
                }
            )
        snapshot.sort(key=lambda d: d.get("position") or 999)
        await self.cache.set("timing:current", snapshot, TIMING_CACHE_TTL)

        weather = await self.get_weather(sk)
        if weather:
            await self.cache.set("weather:current", weather[-1], WEATHER_CACHE_TTL)

    async def refresh_telemetry(self, driver_number: int) -> Optional[Dict[str, Any]]:
        if not self._current_session_key:
            return None
        data = await self.get_car_data(self._current_session_key, driver_number)
        if not data:
            return None
        latest = data[-1]
        frame = {
            "driver_number": driver_number,
            "timestamp": time.time(),
            "throttle": latest.get("throttle"),
            "brake": latest.get("brake"),
            "drs": latest.get("drs"),
            "n_gear": latest.get("n_gear"),
            "rpm": latest.get("rpm"),
            "speed": latest.get("speed"),
            "session_key": self._current_session_key,
        }
        await self.cache.set(f"telemetry:{driver_number}", frame, TELEMETRY_CACHE_TTL)
        return frame

    async def run_polling_loop(self) -> None:
        last_session_refresh = 0.0
        while True:
            try:
                now = time.monotonic()
                if now - last_session_refresh > SESSION_POLL_INTERVAL or not self._current_session_key:
                    await self._refresh_session()
                    last_session_refresh = now
                await self._refresh_timing()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                log.exception("polling loop error: %s", e)
            await asyncio.sleep(TIMING_POLL_INTERVAL)
