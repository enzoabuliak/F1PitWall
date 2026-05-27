from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.get("/race-state")
async def race_state(request: Request):
    state = await request.app.state.cache.get("race:state")
    weather = await request.app.state.cache.get("weather:current")
    if not state:
        return {"status": "no active session", "race_state": None, "weather": None}
    return {"race_state": state, "weather": weather}


@router.get("/timing")
async def timing(request: Request):
    snapshot = await request.app.state.cache.get("timing:current") or []
    return {"timing": snapshot}


@router.get("/telemetry/{driver_number}")
async def telemetry(driver_number: int, request: Request):
    cached = await request.app.state.cache.get(f"telemetry:{driver_number}")
    if cached:
        return cached
    frame = await request.app.state.openf1.refresh_telemetry(driver_number)
    if not frame:
        raise HTTPException(status_code=404, detail="No telemetry available for driver")
    return frame


@router.get("/drivers")
async def drivers(request: Request):
    driver_map = await request.app.state.cache.get("drivers:map") or {}
    return {"drivers": list(driver_map.values())}


@router.get("/teams")
async def teams(request: Request):
    driver_map = await request.app.state.cache.get("drivers:map") or {}
    timing = await request.app.state.cache.get("timing:current") or []
    timing_by_num = {t["driver_number"]: t for t in timing}

    teams_map = {}
    for driver_number, d in driver_map.items():
        team_name = d.get("team_name") or "Unknown"
        team = teams_map.setdefault(
            team_name,
            {"team_name": team_name, "team_colour": d.get("team_colour"), "drivers": []},
        )
        t = timing_by_num.get(int(driver_number), {})
        team["drivers"].append(
            {
                "driver_number": int(driver_number),
                "full_name": d.get("full_name"),
                "name_acronym": d.get("name_acronym"),
                "headshot_url": d.get("headshot_url"),
                "country_code": d.get("country_code"),
                "position": t.get("position"),
                "gap_to_leader": t.get("gap_to_leader"),
                "last_lap_time": t.get("last_lap_time"),
                "tire_compound": t.get("tire_compound"),
            }
        )
    for t in teams_map.values():
        t["drivers"].sort(key=lambda d: d.get("position") or 999)
    return {"teams": sorted(teams_map.values(), key=lambda t: t["team_name"])}
