from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.get("/stints")
async def stints(request: Request):
    cache = request.app.state.cache
    race_state = await cache.get("race:state") or {}
    session_key = race_state.get("session_key")
    if not session_key:
        raise HTTPException(status_code=503, detail="No active session")
    cache_key = f"strategy:stints:{session_key}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    drivers_map = await cache.get("drivers:map") or {}
    timing = await cache.get("timing:current") or []
    timing_by_num = {t["driver_number"]: t for t in timing}

    raw = await request.app.state.openf1.get_stints(session_key)
    by_driver: Dict[int, List[Dict[str, Any]]] = {}
    max_lap = 0
    for r in raw:
        dn = r.get("driver_number")
        if dn is None:
            continue
        by_driver.setdefault(dn, []).append(r)
        end = r.get("lap_end")
        if isinstance(end, (int, float)) and end > max_lap:
            max_lap = int(end)
    for stints_list in by_driver.values():
        stints_list.sort(key=lambda s: s.get("stint_number") or 0)

    rows: List[Dict[str, Any]] = []
    for dn, stints_list in by_driver.items():
        info = drivers_map.get(dn) or drivers_map.get(str(dn)) or {}
        t = timing_by_num.get(dn, {})
        formatted = []
        for s in stints_list:
            formatted.append(
                {
                    "stint_number": s.get("stint_number"),
                    "compound": s.get("compound"),
                    "lap_start": s.get("lap_start"),
                    "lap_end": s.get("lap_end"),
                    "tyre_age_at_start": s.get("tyre_age_at_start"),
                }
            )
        rows.append(
            {
                "driver_number": dn,
                "full_name": info.get("full_name"),
                "name_acronym": info.get("name_acronym"),
                "team_name": info.get("team_name"),
                "team_colour": info.get("team_colour"),
                "position": t.get("position"),
                "pit_stops": max(0, len(formatted) - 1),
                "stints": formatted,
            }
        )
    rows.sort(key=lambda d: d.get("position") or 999)
    payload = {
        "session_key": session_key,
        "max_lap": max_lap,
        "drivers": rows,
    }
    await cache.set(cache_key, payload, 30)
    return payload
