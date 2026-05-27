from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class DriverPosition(BaseModel):
    driver_number: int
    position: Optional[int] = None
    full_name: Optional[str] = None
    team_name: Optional[str] = None
    team_colour: Optional[str] = None
    gap_to_leader: Optional[float] = None
    gap_to_next: Optional[float] = None
    sector1_time: Optional[float] = None
    sector2_time: Optional[float] = None
    sector3_time: Optional[float] = None
    last_lap_time: Optional[float] = None
    best_lap_time: Optional[float] = None
    pit: Optional[bool] = None
    drs: Optional[bool] = None
    tire_compound: Optional[str] = None
    tire_age: Optional[int] = None


class Weather(BaseModel):
    air_temperature: Optional[float] = None
    track_temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    rainfall: Optional[bool] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[int] = None


class RaceState(BaseModel):
    session_key: Optional[int] = None
    meeting_key: Optional[int] = None
    session_name: Optional[str] = None
    session_type: Optional[str] = None
    country: Optional[str] = None
    circuit: Optional[str] = None
    status: Optional[str] = None
    session_status: Optional[str] = None  # "live" | "upcoming" | "finished"
    flag_status: Optional[str] = None
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    year: Optional[int] = None
    weather: Optional[Weather] = None


class DriverStanding(BaseModel):
    position: int
    driver_number: Optional[int] = None
    driver_code: Optional[str] = None
    full_name: str
    team_name: Optional[str] = None
    points: float
    wins: int


class ConstructorStanding(BaseModel):
    position: int
    team_name: str
    nationality: Optional[str] = None
    points: float
    wins: int


class TimingSnapshot(BaseModel):
    session_key: Optional[int]
    timestamp: float
    drivers: List[DriverPosition]
