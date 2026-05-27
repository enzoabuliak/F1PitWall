from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


def _resolve_year(request: Request, year: Optional[int]) -> int:
    if year:
        return year
    race_state = None
    # synchronous cache peek is async, but we want a quick fallback
    # callers pass year explicitly when needed
    return datetime.now(timezone.utc).year


@router.get("/drivers")
async def driver_standings(request: Request, year: Optional[int] = None):
    if year is None:
        race_state = await request.app.state.cache.get("race:state") or {}
        year = race_state.get("year") or datetime.now(timezone.utc).year
    rows = await request.app.state.ergast.driver_standings(year)
    return {"year": year, "standings": rows}


@router.get("/constructors")
async def constructor_standings(request: Request, year: Optional[int] = None):
    if year is None:
        race_state = await request.app.state.cache.get("race:state") or {}
        year = race_state.get("year") or datetime.now(timezone.utc).year
    rows = await request.app.state.ergast.constructor_standings(year)
    return {"year": year, "standings": rows}


@router.get("/last-race")
async def last_race(request: Request, year: Optional[int] = None):
    if year is None:
        race_state = await request.app.state.cache.get("race:state") or {}
        year = race_state.get("year") or datetime.now(timezone.utc).year
    result = await request.app.state.ergast.last_race_results(year)
    if not result:
        raise HTTPException(status_code=404, detail="No race results available")
    return result
