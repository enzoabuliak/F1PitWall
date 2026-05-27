from typing import Optional

from pydantic import BaseModel


class TelemetryFrame(BaseModel):
    driver_number: int
    timestamp: float
    throttle: Optional[float] = None
    brake: Optional[float] = None
    drs: Optional[int] = None
    n_gear: Optional[int] = None
    rpm: Optional[int] = None
    speed: Optional[float] = None
    session_key: Optional[int] = None


class DriverInfo(BaseModel):
    driver_number: int
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name_acronym: Optional[str] = None
    team_name: Optional[str] = None
    team_colour: Optional[str] = None
    country_code: Optional[str] = None
    headshot_url: Optional[str] = None
