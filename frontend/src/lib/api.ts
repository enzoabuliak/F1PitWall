import type {
  ConstructorStanding,
  DriverPosition,
  DriverStanding,
  LastRaceResults,
  RaceState,
  ScheduleResponse,
  Team,
  TelemetryFrame,
  Weather,
} from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8000/api/live/stream";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

export async function fetchRaceState(): Promise<{ race_state: RaceState | null; weather: Weather | null }> {
  return getJSON("/api/live/race-state");
}

export async function fetchTiming(): Promise<{ timing: DriverPosition[] }> {
  return getJSON("/api/live/timing");
}

export async function fetchDrivers(): Promise<{ drivers: Array<Record<string, unknown>> }> {
  return getJSON("/api/live/drivers");
}

export async function fetchTelemetry(driverNumber: number): Promise<TelemetryFrame> {
  return getJSON(`/api/live/telemetry/${driverNumber}`);
}

export async function fetchTeams(): Promise<{ teams: Team[] }> {
  return getJSON("/api/live/teams");
}

export async function fetchDriverStandings(): Promise<{ year: number; standings: DriverStanding[] }> {
  return getJSON("/api/championship/drivers");
}

export async function fetchConstructorStandings(): Promise<{ year: number; standings: ConstructorStanding[] }> {
  return getJSON("/api/championship/constructors");
}

export async function fetchSchedule(): Promise<ScheduleResponse> {
  return getJSON("/api/championship/schedule");
}

export async function fetchLastRace(): Promise<LastRaceResults> {
  return getJSON("/api/championship/last-race");
}
