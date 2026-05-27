from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


def _parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _derive_overall_flag(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Walk messages newest-first; first definitive track-wide state wins."""
    for m in messages:
        cat = (m.get("category") or "").upper()
        flag = (m.get("flag") or "").upper()
        scope = (m.get("scope") or "").upper()
        msg = (m.get("message") or "").upper()

        if cat == "SAFETYCAR" or "SAFETY CAR" in msg:
            if "VIRTUAL" in msg or "VSC" in msg:
                if "ENDING" in msg or "DEPLOYED" not in msg and "RESTART" in msg:
                    continue
                return {"state": "VSC", "label": "Virtual Safety Car", "since": m.get("date")}
            if "DEPLOYED" in msg or "SAFETY CAR DEPLOYED" in msg:
                return {"state": "SC", "label": "Safety Car", "since": m.get("date")}
            if "IN THIS LAP" in msg or "ENDING" in msg:
                return {"state": "GREEN", "label": "Track clear", "since": m.get("date")}
        if flag == "RED":
            return {"state": "RED", "label": "Red Flag", "since": m.get("date")}
        if flag == "CHEQUERED":
            return {"state": "CHEQUERED", "label": "Chequered Flag", "since": m.get("date")}
        if flag in ("YELLOW", "DOUBLE YELLOW"):
            if scope == "TRACK":
                return {
                    "state": "DOUBLE_YELLOW" if flag == "DOUBLE YELLOW" else "YELLOW",
                    "label": "Double Yellow (track)" if flag == "DOUBLE YELLOW" else "Yellow (track)",
                    "since": m.get("date"),
                }
        if flag == "GREEN" and scope == "TRACK":
            return {"state": "GREEN", "label": "Track clear", "since": m.get("date")}
    return {"state": "GREEN", "label": "Track clear", "since": None}


@router.get("/race-control")
async def race_control(request: Request, limit: int = 12):
    cache = request.app.state.cache
    race_state = await cache.get("race:state") or {}
    session_key = race_state.get("session_key")
    if not session_key:
        raise HTTPException(status_code=503, detail="No active session")
    cache_key = f"race_control:{session_key}:{limit}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    raw = await request.app.state.openf1.get_race_control(session_key=session_key)
    raw.sort(key=lambda m: m.get("date") or "", reverse=True)

    overall = _derive_overall_flag(raw)
    drivers_map = await cache.get("drivers:map") or {}

    messages = []
    for m in raw[:limit]:
        dn = m.get("driver_number")
        info = drivers_map.get(dn) if dn is not None else None
        messages.append(
            {
                "date": m.get("date"),
                "category": m.get("category"),
                "flag": m.get("flag"),
                "scope": m.get("scope"),
                "sector": m.get("sector"),
                "lap_number": m.get("lap_number"),
                "message": m.get("message"),
                "driver_number": dn,
                "driver_acronym": (info or {}).get("name_acronym") if info else None,
            }
        )

    payload = {
        "session_key": session_key,
        "overall": overall,
        "messages": messages,
    }
    await cache.set(cache_key, payload, 10)
    return payload


@router.get("/drs")
async def drs_state(request: Request):
    cache = request.app.state.cache
    race_state = await cache.get("race:state") or {}
    session_key = race_state.get("session_key")
    if not session_key:
        raise HTTPException(status_code=503, detail="No active session")
    cache_key = f"drs:{session_key}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    date_end = race_state.get("date_end") or race_state.get("date_start")
    end_dt = _parse_date(date_end)
    if end_dt is None:
        raise HTTPException(status_code=503, detail="No session window")
    start_dt = end_dt - timedelta(seconds=5)
    rows = await request.app.state.openf1.get_car_data_window(
        session_key=session_key,
        date_gt=start_dt.isoformat().replace("+00:00", "Z"),
        date_lt=end_dt.isoformat().replace("+00:00", "Z"),
    )
    latest: Dict[int, Dict[str, Any]] = {}
    for r in rows:
        dn = r.get("driver_number")
        if dn is None:
            continue
        prev = latest.get(dn)
        if prev is None or (r.get("date") or "") > (prev.get("date") or ""):
            latest[dn] = r

    drs_by_driver: Dict[int, Dict[str, Any]] = {}
    for dn, r in latest.items():
        drs_value = r.get("drs")
        drs_open = drs_value is not None and int(drs_value) >= 10
        drs_by_driver[dn] = {
            "drs": drs_value,
            "open": drs_open,
        }
    payload = {"session_key": session_key, "drs": drs_by_driver}
    await cache.set(cache_key, payload, 3)
    return payload
