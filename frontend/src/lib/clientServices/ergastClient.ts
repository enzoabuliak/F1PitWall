import type {
  ConstructorStanding,
  DriverStanding,
  LastRaceResults,
  QualifyingSession,
  ScheduleResponse,
  SeasonRoundResults,
  SeasonWinner,
} from "../types";
import { memo } from "./cache";

const nonEmpty = (v: { length: number } | null | undefined) =>
  !!v && v.length > 0;

function parseQTime(s: string | null | undefined): number | null {
  if (!s) return null;
  try {
    if (s.includes(":")) {
      const [m, rest] = s.split(":");
      return parseInt(m, 10) * 60 + parseFloat(rest);
    }
    return parseFloat(s);
  } catch {
    return null;
  }
}

const BASE = "https://api.jolpi.ca/ergast/f1";

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}.json`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function combineDateTime(date?: string | null, time?: string | null): string | null {
  if (!date) return null;
  if (!time) return `${date}T00:00:00Z`;
  return `${date}T${time}`;
}

interface ErgastResponse<TKey extends string, TVal> {
  MRData: { [K in TKey]: TVal };
}

export async function getDriverStandings(year: number): Promise<{ year: number; standings: DriverStanding[] }> {
  return memo(
    `ergast:drivers:${year}`,
    600,
    async () => {
    const data = await get<ErgastResponse<"StandingsTable", { StandingsLists: Array<{ DriverStandings: Array<Record<string, unknown>> }> }>>(
      `/${year}/driverStandings`,
    );
    const lists = data?.MRData?.StandingsTable?.StandingsLists;
    if (!lists?.length) return { year, standings: [] };
    const standings: DriverStanding[] = lists[0].DriverStandings.map((r) => {
      const driver = (r.Driver ?? {}) as Record<string, string>;
      const constructors = (r.Constructors ?? []) as Array<Record<string, string>>;
      return {
        position: parseInt(String(r.position ?? 0), 10),
        driver_code: driver.code ?? null,
        driver_number: driver.permanentNumber ? parseInt(driver.permanentNumber, 10) : null,
        full_name: `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim(),
        team_name: constructors[0]?.name ?? null,
        points: parseFloat(String(r.points ?? 0)),
        wins: parseInt(String(r.wins ?? 0), 10),
      };
    });
    return { year, standings };
  },
  { shouldCache: (r) => nonEmpty(r.standings) },
  );
}

export async function getConstructorStandings(year: number): Promise<{ year: number; standings: ConstructorStanding[] }> {
  return memo(
    `ergast:constructors:${year}`,
    600,
    async () => {
    const data = await get<ErgastResponse<"StandingsTable", { StandingsLists: Array<{ ConstructorStandings: Array<Record<string, unknown>> }> }>>(
      `/${year}/constructorStandings`,
    );
    const lists = data?.MRData?.StandingsTable?.StandingsLists;
    if (!lists?.length) return { year, standings: [] };
    const standings: ConstructorStanding[] = lists[0].ConstructorStandings.map((r) => {
      const constructor = (r.Constructor ?? {}) as Record<string, string>;
      return {
        position: parseInt(String(r.position ?? 0), 10),
        team_name: constructor.name ?? "",
        nationality: constructor.nationality ?? null,
        points: parseFloat(String(r.points ?? 0)),
        wins: parseInt(String(r.wins ?? 0), 10),
      };
    });
    return { year, standings };
  },
  { shouldCache: (r) => nonEmpty(r.standings) },
  );
}

export async function getSchedule(year: number): Promise<ScheduleResponse> {
  return memo(
    `ergast:schedule:${year}`,
    1800,
    async () => {
    const data = await get<ErgastResponse<"RaceTable", { Races: Array<Record<string, unknown>> }>>(`/${year}`);
    const races = data?.MRData?.RaceTable?.Races ?? [];
    const schedule = races.map((r) => {
      const circuit = (r.Circuit ?? {}) as Record<string, unknown>;
      const location = (circuit.Location ?? {}) as Record<string, string>;
      const fp1 = r.FirstPractice as Record<string, string> | undefined;
      const fp2 = r.SecondPractice as Record<string, string> | undefined;
      const fp3 = r.ThirdPractice as Record<string, string> | undefined;
      const quali = r.Qualifying as Record<string, string> | undefined;
      const sprint = r.Sprint as Record<string, string> | undefined;
      const sessions = {
        fp1: combineDateTime(fp1?.date, fp1?.time),
        fp2: combineDateTime(fp2?.date, fp2?.time),
        fp3: combineDateTime(fp3?.date, fp3?.time),
        qualifying: combineDateTime(quali?.date, quali?.time),
        sprint: combineDateTime(sprint?.date, sprint?.time),
        race: combineDateTime(r.date as string | undefined, r.time as string | undefined),
      };
      return {
        round: parseInt(String(r.round ?? 0), 10),
        race_name: (r.raceName as string) ?? "",
        circuit_name: (circuit.circuitName as string) ?? null,
        circuit_id: (circuit.circuitId as string) ?? null,
        country: location.country ?? null,
        locality: location.locality ?? null,
        date: (r.date as string) ?? null,
        time: (r.time as string) ?? null,
        race_start: sessions.race,
        sessions,
      };
    });
    const now = new Date().toISOString();
    const next_race = schedule.find((r) => r.race_start && r.race_start > now) ?? null;
    let last_race: typeof schedule[number] | null = null;
    for (const r of schedule) {
      if (r.race_start && r.race_start <= now) last_race = r;
    }
    return { year, now, schedule, next_race, last_race };
  },
  { shouldCache: (r) => nonEmpty(r.schedule) },
  );
}

export async function getAvailableSeasons(): Promise<number[]> {
  return memo(
    "ergast:seasons",
    86400,
    async () => {
    const years: number[] = [];
    for (const offset of [0, 100]) {
      const data = await get<ErgastResponse<"SeasonTable", { Seasons: Array<Record<string, string>> }>>(
        `/seasons?limit=100&offset=${offset}`,
      );
      const rows = data?.MRData?.SeasonTable?.Seasons ?? [];
      for (const r of rows) {
        const y = parseInt(r.season ?? "", 10);
        if (!Number.isNaN(y)) years.push(y);
      }
      if (rows.length < 100) break;
    }
    years.sort((a, b) => b - a);
    return years;
  },
  { shouldCache: (r) => nonEmpty(r) },
  );
}

export async function getSeasonWinners(year: number): Promise<SeasonWinner[]> {
  return memo(
    `ergast:winners:${year}`,
    3600,
    async () => {
    const data = await get<ErgastResponse<"RaceTable", { Races: Array<Record<string, unknown>> }>>(
      `/${year}/results/1?limit=100`,
    );
    const races = data?.MRData?.RaceTable?.Races ?? [];
    const rows: SeasonWinner[] = races.map((r) => {
      const circuit = (r.Circuit ?? {}) as Record<string, unknown>;
      const location = (circuit.Location ?? {}) as Record<string, string>;
      const results = ((r.Results ?? []) as Array<Record<string, unknown>>)[0] ?? {};
      const driver = (results.Driver ?? {}) as Record<string, string>;
      const constructor = (results.Constructor ?? {}) as Record<string, string>;
      const timeObj = (results.Time ?? {}) as Record<string, string>;
      return {
        round: parseInt(String(r.round ?? 0), 10),
        race_name: (r.raceName as string) ?? null,
        circuit: (circuit.circuitName as string) ?? null,
        country: location.country ?? null,
        date: (r.date as string) ?? null,
        winner_full_name:
          `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim() || null,
        winner_code: driver.code ?? null,
        winner_constructor: constructor.name ?? null,
        winner_time: timeObj.time ?? null,
      };
    });
    rows.sort((a, b) => a.round - b.round);
    return rows;
  },
  { shouldCache: (r) => nonEmpty(r) },
  );
}

export async function getAllSeasonResults(year: number): Promise<SeasonRoundResults[]> {
  return memo(
    `ergast:allresults:${year}`,
    3600,
    async () => {
    // Ergast caps `limit` at 100, so we paginate and merge by round.
    const racesByRound = new Map<number, Record<string, unknown>>();
    let offset = 0;
    const pageSize = 100;
    for (let i = 0; i < 20; i++) {
      const data = await get<ErgastResponse<"RaceTable", { Races: Array<Record<string, unknown>> }> & {
        MRData: { total?: string };
      }>(`/${year}/results?limit=${pageSize}&offset=${offset}`);
      const mr = data?.MRData;
      if (!mr) break;
      const total = parseInt(mr.total ?? "0", 10);
      const pageRaces = mr.RaceTable?.Races ?? [];
      if (!pageRaces.length) break;
      for (const r of pageRaces) {
        const round = parseInt(String(r.round ?? 0), 10);
        if (!racesByRound.has(round)) {
          racesByRound.set(round, { ...r, Results: [] });
        }
        const existing = racesByRound.get(round)!;
        const merged = [
          ...((existing.Results as Array<unknown>) ?? []),
          ...((r.Results as Array<unknown>) ?? []),
        ];
        existing.Results = merged;
      }
      offset += pageSize;
      if (offset >= total) break;
    }
    const races = [...racesByRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, r]) => r);
    const rounds: SeasonRoundResults[] = races.map((r) => {
      const results = (r.Results ?? []) as Array<Record<string, unknown>>;
      const points: Record<string, number> = {};
      const wins: Record<string, number> = {};
      const podiums: Record<string, number> = {};
      for (const res of results) {
        const constructor = ((res.Constructor ?? {}) as Record<string, string>).name;
        if (!constructor) continue;
        const pts = parseFloat(String(res.points ?? 0));
        points[constructor] = (points[constructor] ?? 0) + (Number.isFinite(pts) ? pts : 0);
        const pos = parseInt(String(res.position ?? 0), 10);
        if (pos === 1) wins[constructor] = 1;
        if (pos >= 1 && pos <= 3) podiums[constructor] = (podiums[constructor] ?? 0) + 1;
      }
      return {
        round: parseInt(String(r.round ?? 0), 10),
        race_name: (r.raceName as string) ?? null,
        country: (((r.Circuit ?? {}) as Record<string, unknown>).Location as Record<string, string> | undefined)?.country ?? null,
        date: (r.date as string) ?? null,
        constructor_points: points,
        constructor_wins: wins,
        constructor_podiums: podiums,
      };
    });
    rounds.sort((a, b) => a.round - b.round);
    return rounds;
  },
  { shouldCache: (r) => nonEmpty(r) },
  );
}

export async function getLastQualifying(year: number): Promise<QualifyingSession | null> {
  return memo(
    `ergast:lastquali:${year}`,
    3600,
    async () => {
    const data = await get<ErgastResponse<"RaceTable", { Races: Array<Record<string, unknown>> }>>(
      `/${year}/last/qualifying`,
    );
    const races = data?.MRData?.RaceTable?.Races ?? [];
    if (!races.length) return null;
    const race = races[0];
    const circuit = (race.Circuit ?? {}) as Record<string, unknown>;
    const location = (circuit.Location ?? {}) as Record<string, string>;
    const raw = (race.QualifyingResults ?? []) as Array<Record<string, unknown>>;
    const results = raw.map((r) => {
      const driver = (r.Driver ?? {}) as Record<string, string>;
      const constructor = (r.Constructor ?? {}) as Record<string, string>;
      const q1 = (r.Q1 as string) ?? null;
      const q2 = (r.Q2 as string) ?? null;
      const q3 = (r.Q3 as string) ?? null;
      return {
        position: parseInt(String(r.position ?? 0), 10),
        driver_code: driver.code ?? null,
        driver_number: driver.permanentNumber ? parseInt(driver.permanentNumber, 10) : null,
        full_name: `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim(),
        team_name: constructor.name ?? null,
        q1,
        q2,
        q3,
        q1_seconds: parseQTime(q1),
        q2_seconds: parseQTime(q2),
        q3_seconds: parseQTime(q3),
      };
    });
    return {
      race_name: (race.raceName as string) ?? "",
      circuit: (circuit.circuitName as string) ?? null,
      country: location.country ?? null,
      date: (race.date as string) ?? null,
      results,
    };
  },
  { shouldCache: (r) => !!r && r.results.length > 0 },
  );
}

export async function getLastRace(year: number): Promise<LastRaceResults | null> {
  return memo(
    `ergast:lastrace:${year}`,
    3600,
    async () => {
    const data = await get<ErgastResponse<"RaceTable", { Races: Array<Record<string, unknown>> }>>(
      `/${year}/last/results`,
    );
    const races = data?.MRData?.RaceTable?.Races ?? [];
    if (!races.length) return null;
    const race = races[0];
    const circuit = (race.Circuit ?? {}) as Record<string, unknown>;
    const location = (circuit.Location ?? {}) as Record<string, string>;
    const rawResults = (race.Results ?? []) as Array<Record<string, unknown>>;
    const results = rawResults.map((r) => {
      const driver = (r.Driver ?? {}) as Record<string, string>;
      const constructor = (r.Constructor ?? {}) as Record<string, string>;
      const timeObj = (r.Time ?? {}) as Record<string, string>;
      return {
        position: parseInt(String(r.position ?? 0), 10),
        driver_code: driver.code ?? null,
        full_name: `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim(),
        team_name: constructor.name ?? null,
        points: parseFloat(String(r.points ?? 0)),
        status: (r.status as string) ?? null,
        time: timeObj.time ?? null,
      };
    });
    return {
      race_name: (race.raceName as string) ?? "",
      circuit: (circuit.circuitName as string) ?? null,
      country: location.country ?? null,
      date: (race.date as string) ?? null,
      results,
    };
  },
  { shouldCache: (r) => !!r && r.results.length > 0 },
  );
}
