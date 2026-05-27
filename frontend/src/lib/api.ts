import type {
  ConstructorStanding,
  DriverPosition,
  DriverStanding,
  DrsResponse,
  LastRaceResults,
  QualifyingSession,
  RaceControlResponse,
  RaceState,
  ScheduleResponse,
  SeasonRoundResults,
  SeasonWinner,
  StrategyResponse,
  Team,
  TelemetryFrame,
  TrackMap,
  Weather,
} from "./types";
import * as openf1 from "./clientServices/openf1Client";
import * as ergast from "./clientServices/ergastClient";

export const USE_STATIC = process.env.NEXT_PUBLIC_USE_STATIC === "1";
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8001";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8001/api/live/stream";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function currentYear(): Promise<number> {
  if (USE_STATIC) {
    const { race_state } = await openf1.getRaceState();
    return race_state?.year ?? new Date().getUTCFullYear();
  }
  return new Date().getUTCFullYear();
}

export async function fetchRaceState(): Promise<{ race_state: RaceState | null; weather: Weather | null }> {
  if (USE_STATIC) return openf1.getRaceState();
  return getJSON("/api/live/race-state");
}

export async function fetchTiming(): Promise<{ timing: DriverPosition[] }> {
  if (USE_STATIC) return openf1.getTiming();
  return getJSON("/api/live/timing");
}

export async function fetchDrivers(): Promise<{ drivers: Array<Record<string, unknown>> }> {
  if (USE_STATIC) {
    const { teams } = await openf1.getTeams();
    return { drivers: teams.flatMap((t) => t.drivers) as unknown as Array<Record<string, unknown>> };
  }
  return getJSON("/api/live/drivers");
}

export async function fetchTelemetry(driverNumber: number): Promise<TelemetryFrame> {
  if (USE_STATIC) return openf1.getTelemetry(driverNumber);
  return getJSON(`/api/live/telemetry/${driverNumber}`);
}

export async function fetchTeams(): Promise<{ teams: Team[] }> {
  if (USE_STATIC) return openf1.getTeams();
  return getJSON("/api/live/teams");
}

export async function fetchDriverStandings(): Promise<{ year: number; standings: DriverStanding[] }> {
  if (USE_STATIC) return ergast.getDriverStandings(await currentYear());
  return getJSON("/api/championship/drivers");
}

export async function fetchConstructorStandings(): Promise<{ year: number; standings: ConstructorStanding[] }> {
  if (USE_STATIC) return ergast.getConstructorStandings(await currentYear());
  return getJSON("/api/championship/constructors");
}

export async function fetchSchedule(): Promise<ScheduleResponse> {
  if (USE_STATIC) return ergast.getSchedule(await currentYear());
  return getJSON("/api/championship/schedule");
}

export async function fetchLastRace(): Promise<LastRaceResults> {
  if (USE_STATIC) {
    const result = await ergast.getLastRace(await currentYear());
    if (!result) throw new Error("no last race");
    return result;
  }
  return getJSON("/api/championship/last-race");
}

export async function fetchTrackMap(): Promise<TrackMap | null> {
  if (USE_STATIC) return openf1.getTrackMap();
  try {
    return await getJSON<TrackMap>("/api/track/map");
  } catch {
    return null;
  }
}

export async function fetchAvailableSeasons(): Promise<number[]> {
  if (USE_STATIC) return ergast.getAvailableSeasons();
  try {
    const d = await getJSON<{ seasons: number[] }>("/api/championship/seasons");
    return d.seasons;
  } catch {
    return [];
  }
}

export async function fetchSeasonWinners(year: number): Promise<SeasonWinner[]> {
  if (USE_STATIC) return ergast.getSeasonWinners(year);
  try {
    const d = await getJSON<{ year: number; winners: SeasonWinner[] }>(
      `/api/championship/winners/${year}`,
    );
    return d.winners;
  } catch {
    return [];
  }
}

export async function fetchAllSeasonResults(year: number): Promise<SeasonRoundResults[]> {
  if (USE_STATIC) return ergast.getAllSeasonResults(year);
  try {
    const d = await getJSON<{ year: number; rounds: SeasonRoundResults[] }>(
      `/api/championship/all-results/${year}`,
    );
    return d.rounds;
  } catch {
    return [];
  }
}

export async function fetchLastQualifying(): Promise<QualifyingSession | null> {
  if (USE_STATIC) return ergast.getLastQualifying(await currentYear());
  try {
    return await getJSON<QualifyingSession>("/api/championship/last-qualifying");
  } catch {
    return null;
  }
}

export async function fetchRaceControl(): Promise<RaceControlResponse | null> {
  if (USE_STATIC) return openf1.getRaceControl();
  try {
    return await getJSON<RaceControlResponse>("/api/live/race-control");
  } catch {
    return null;
  }
}

export async function fetchDrs(): Promise<DrsResponse | null> {
  if (USE_STATIC) return openf1.getDrs();
  try {
    return await getJSON<DrsResponse>("/api/live/drs");
  } catch {
    return null;
  }
}

export async function fetchStrategy(): Promise<StrategyResponse | null> {
  if (USE_STATIC) return openf1.getStrategy();
  try {
    return await getJSON<StrategyResponse>("/api/strategy/stints");
  } catch {
    return null;
  }
}
