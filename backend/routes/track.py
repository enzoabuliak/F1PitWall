from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()

OUTLINE_TTL = 86400  # circuit outline doesn't change
POSITIONS_TTL = 5


def _parse_date(s: str) -> Optional[datetime]:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _bounds(points: List[Tuple[float, float]]) -> Dict[str, float]:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    if not xs or not ys:
        return {"min_x": 0, "max_x": 1, "min_y": 0, "max_y": 1}
    return {"min_x": min(xs), "max_x": max(xs), "min_y": min(ys), "max_y": max(ys)}


async def _build_outline(request: Request, session_key: int) -> Dict[str, Any]:
    cache = request.app.state.cache
    cache_key = f"track:outline:{session_key}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    openf1 = request.app.state.openf1

    # pick a driver — leader from positions, fall back to first
    timing = await cache.get("timing:current") or []
    leader_num = timing[0]["driver_number"] if timing else None
    if leader_num is None:
        drivers_map = await cache.get("drivers:map") or {}
        if drivers_map:
            leader_num = int(next(iter(drivers_map.keys())))
    if leader_num is None:
        raise HTTPException(status_code=503, detail="No drivers available yet")

    race_state = await cache.get("race:state") or {}
    date_start = race_state.get("date_start")
    base_dt = _parse_date(date_start) if date_start else None
    if base_dt is None:
        raise HTTPException(status_code=503, detail="No session start time")

    # try a window 20 minutes into the race for ~110s of continuous laps
    sample_start = base_dt + timedelta(minutes=20)
    sample_end = sample_start + timedelta(seconds=110)
    rows = await openf1.get_location(
        session_key=session_key,
        driver_number=leader_num,
        date_gt=sample_start.isoformat().replace("+00:00", "Z"),
        date_lt=sample_end.isoformat().replace("+00:00", "Z"),
    )
    if not rows:
        # fallback to a window 50 minutes in
        sample_start = base_dt + timedelta(minutes=50)
        sample_end = sample_start + timedelta(seconds=110)
        rows = await openf1.get_location(
            session_key=session_key,
            driver_number=leader_num,
            date_gt=sample_start.isoformat().replace("+00:00", "Z"),
            date_lt=sample_end.isoformat().replace("+00:00", "Z"),
        )
    points: List[Tuple[float, float]] = []
    for r in rows:
        x = r.get("x")
        y = r.get("y")
        if x is None or y is None:
            continue
        points.append((float(x), float(y)))

    # simple downsample to ~200 points if larger
    if len(points) > 200:
        step = max(1, len(points) // 200)
        points = points[::step]

    payload = {
        "session_key": session_key,
        "driver_number": leader_num,
        "points": points,
        "bounds": _bounds(points),
    }
    if points:
        await cache.set(cache_key, payload, OUTLINE_TTL)
    return payload


async def _build_positions(request: Request, session_key: int) -> List[Dict[str, Any]]:
    cache = request.app.state.cache
    cache_key = f"track:positions:{session_key}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    openf1 = request.app.state.openf1
    race_state = await cache.get("race:state") or {}
    drivers_map = await cache.get("drivers:map") or {}
    timing = await cache.get("timing:current") or []
    timing_by_num = {t["driver_number"]: t for t in timing}

    date_end = race_state.get("date_end") or race_state.get("date_start")
    end_dt = _parse_date(date_end) if date_end else None
    if end_dt is None:
        raise HTTPException(status_code=503, detail="No session window")
    window_start = end_dt - timedelta(seconds=15)
    rows = await openf1.get_location(
        session_key=session_key,
        date_gt=window_start.isoformat().replace("+00:00", "Z"),
        date_lt=end_dt.isoformat().replace("+00:00", "Z"),
    )
    latest_by_driver: Dict[int, Dict[str, Any]] = {}
    for r in rows:
        dn = r.get("driver_number")
        if dn is None or r.get("x") is None or r.get("y") is None:
            continue
        prev = latest_by_driver.get(dn)
        if prev is None or r.get("date", "") > prev.get("date", ""):
            latest_by_driver[dn] = r

    out: List[Dict[str, Any]] = []
    for dn, r in latest_by_driver.items():
        info = drivers_map.get(dn, {})
        t = timing_by_num.get(dn, {})
        out.append(
            {
                "driver_number": dn,
                "x": float(r["x"]),
                "y": float(r["y"]),
                "team_colour": info.get("team_colour"),
                "name_acronym": info.get("name_acronym"),
                "full_name": info.get("full_name"),
                "position": t.get("position"),
            }
        )
    out.sort(key=lambda d: d.get("position") or 999)
    await cache.set(cache_key, out, POSITIONS_TTL)
    return out


@router.get("/map")
async def track_map(request: Request):
    race_state = await request.app.state.cache.get("race:state") or {}
    session_key = race_state.get("session_key")
    if not session_key:
        raise HTTPException(status_code=503, detail="No active session")
    outline = await _build_outline(request, session_key)
    positions = await _build_positions(request, session_key)
    return {
        "session_key": session_key,
        "outline": outline,
        "positions": positions,
    }


@router.get("/positions")
async def track_positions(request: Request):
    race_state = await request.app.state.cache.get("race:state") or {}
    session_key = race_state.get("session_key")
    if not session_key:
        raise HTTPException(status_code=503, detail="No active session")
    positions = await _build_positions(request, session_key)
    return {"session_key": session_key, "positions": positions}
