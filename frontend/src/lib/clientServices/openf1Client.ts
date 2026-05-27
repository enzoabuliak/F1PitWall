import type {
  DriverPosition,
  RaceState,
  Team,
  TelemetryFrame,
  TrackMap,
  TrackOutline,
  TrackPosition,
  Weather,
} from "../types";
import { memo } from "./cache";

const BASE = "https://api.openf1.org/v1";

interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
  date_end: string;
  year?: number;
}

interface DriverRaw {
  driver_number: number;
  full_name: string;
  team_name: string;
  team_colour: string;
  name_acronym: string;
  headshot_url: string;
  country_code: string;
}

interface PositionRaw {
  date: string;
  driver_number: number;
  position: number;
}

interface IntervalRaw {
  date: string;
  driver_number: number;
  gap_to_leader: number | string | null;
  interval: number | string | null;
}

interface LapRaw {
  driver_number: number;
  lap_number: number;
  date_start?: string;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  lap_duration: number | null;
}

interface StintRaw {
  driver_number: number;
  stint_number: number;
  compound: string;
  tyre_age_at_start: number;
}

interface WeatherRaw {
  date: string;
  air_temperature: number | null;
  track_temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  rainfall: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
}

interface CarDataRaw {
  date: string;
  driver_number: number;
  throttle: number | null;
  brake: number | null;
  drs: number | null;
  n_gear: number | null;
  rpm: number | null;
  speed: number | null;
}

async function get<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`OpenF1 ${path} ${res.status}`);
  return (await res.json()) as T[];
}

function computeSessionStatus(start?: string, end?: string): "live" | "upcoming" | "finished" | "unknown" {
  if (!start) return "unknown";
  const now = Date.now();
  const startMs = new Date(start).getTime();
  if (Number.isNaN(startMs)) return "unknown";
  if (now < startMs) return "upcoming";
  if (end) {
    const endMs = new Date(end).getTime();
    if (!Number.isNaN(endMs)) return now <= endMs ? "live" : "finished";
  }
  return now - startMs < 7_200_000 ? "live" : "finished";
}

export async function getLatestSession(): Promise<Session | null> {
  return memo("openf1:session:latest", 30, async () => {
    const rows = await get<Session>("/sessions", { session_key: "latest" });
    return rows[0] ?? null;
  });
}

export async function getRaceState(): Promise<{ race_state: RaceState | null; weather: Weather | null }> {
  const session = await getLatestSession();
  if (!session) return { race_state: null, weather: null };
  const weatherList = await memo(`openf1:weather:${session.session_key}`, 30, () =>
    get<WeatherRaw>("/weather", { session_key: session.session_key }),
  );
  const weather = weatherList[weatherList.length - 1] ?? null;
  const race_state: RaceState = {
    session_key: session.session_key,
    meeting_key: session.meeting_key,
    session_name: session.session_name,
    session_type: session.session_type,
    country: session.country_name,
    circuit: session.circuit_short_name,
    status: "active",
    session_status: computeSessionStatus(session.date_start, session.date_end),
    flag_status: null,
    date_start: session.date_start,
    date_end: session.date_end,
    year: session.year ?? (session.date_start ? parseInt(session.date_start.slice(0, 4), 10) : null),
  };
  return {
    race_state,
    weather: weather
      ? {
          air_temperature: weather.air_temperature,
          track_temperature: weather.track_temperature,
          humidity: weather.humidity,
          pressure: weather.pressure,
          rainfall: weather.rainfall,
          wind_speed: weather.wind_speed,
          wind_direction: weather.wind_direction,
        }
      : null,
  };
}

interface RawCaches {
  drivers: DriverRaw[];
  positions: PositionRaw[];
  intervals: IntervalRaw[];
  laps: LapRaw[];
  stints: StintRaw[];
}

async function loadRawForSession(sessionKey: number): Promise<RawCaches> {
  return memo(`openf1:raw:${sessionKey}`, 60, async () => {
    const [drivers, positions, intervals, laps, stints] = await Promise.all([
      get<DriverRaw>("/drivers", { session_key: sessionKey }),
      get<PositionRaw>("/position", { session_key: sessionKey }),
      get<IntervalRaw>("/intervals", { session_key: sessionKey }),
      get<LapRaw>("/laps", { session_key: sessionKey }),
      get<StintRaw>("/stints", { session_key: sessionKey }),
    ]);
    return { drivers, positions, intervals, laps, stints };
  });
}

export async function getTiming(): Promise<{ timing: DriverPosition[] }> {
  const session = await getLatestSession();
  if (!session) return { timing: [] };
  const { drivers, positions, intervals, laps, stints } = await loadRawForSession(session.session_key);

  const driverMap = new Map<number, DriverRaw>(drivers.map((d) => [d.driver_number, d]));
  const latestPos = new Map<number, PositionRaw>();
  for (const p of positions) latestPos.set(p.driver_number, p);
  const latestInt = new Map<number, IntervalRaw>();
  for (const i of intervals) latestInt.set(i.driver_number, i);
  const latestLap = new Map<number, LapRaw>();
  for (const l of laps) latestLap.set(l.driver_number, l);
  const latestStint = new Map<number, StintRaw>();
  for (const s of stints) latestStint.set(s.driver_number, s);

  const out: DriverPosition[] = [];
  for (const [dn, pos] of latestPos.entries()) {
    const info = driverMap.get(dn);
    const interval = latestInt.get(dn);
    const lap = latestLap.get(dn);
    const stint = latestStint.get(dn);
    let gap: number | null = null;
    const raw = interval?.gap_to_leader;
    if (typeof raw === "number") gap = raw;
    else if (typeof raw === "string") {
      const cleaned = raw.replace(/^[+L]/, "");
      const parsed = parseFloat(cleaned);
      gap = Number.isFinite(parsed) ? parsed : null;
    }
    out.push({
      driver_number: dn,
      position: pos.position,
      full_name: info?.full_name ?? null,
      team_name: info?.team_name ?? null,
      team_colour: info?.team_colour ?? null,
      gap_to_leader: gap,
      gap_to_next: typeof interval?.interval === "number" ? interval.interval : null,
      sector1_time: lap?.duration_sector_1 ?? null,
      sector2_time: lap?.duration_sector_2 ?? null,
      sector3_time: lap?.duration_sector_3 ?? null,
      last_lap_time: lap?.lap_duration ?? null,
      best_lap_time: null,
      pit: null,
      drs: null,
      tire_compound: stint?.compound ?? null,
      tire_age: stint?.tyre_age_at_start ?? null,
    });
  }
  out.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  return { timing: out };
}

export async function getTeams(): Promise<{ teams: Team[] }> {
  const session = await getLatestSession();
  if (!session) return { teams: [] };
  const { drivers } = await loadRawForSession(session.session_key);
  const { timing } = await getTiming();
  const timingByNum = new Map(timing.map((t) => [t.driver_number, t]));

  const teamMap = new Map<string, Team>();
  for (const d of drivers) {
    const name = d.team_name || "Unknown";
    if (!teamMap.has(name)) {
      teamMap.set(name, {
        team_name: name,
        team_colour: d.team_colour ?? null,
        drivers: [],
      });
    }
    const t = timingByNum.get(d.driver_number);
    teamMap.get(name)!.drivers.push({
      driver_number: d.driver_number,
      full_name: d.full_name,
      name_acronym: d.name_acronym,
      headshot_url: d.headshot_url,
      country_code: d.country_code,
      position: t?.position ?? null,
      gap_to_leader: t?.gap_to_leader ?? null,
      last_lap_time: t?.last_lap_time ?? null,
      tire_compound: t?.tire_compound ?? null,
    });
  }
  for (const t of teamMap.values()) {
    t.drivers.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  }
  return {
    teams: [...teamMap.values()].sort((a, b) => a.team_name.localeCompare(b.team_name)),
  };
}

interface LocationRaw {
  date: string;
  driver_number: number;
  x: number | null;
  y: number | null;
  z: number | null;
}

async function getLocation(
  sessionKey: number,
  params: { driverNumber?: number; dateGt?: string; dateLt?: string },
): Promise<LocationRaw[]> {
  const url = new URL(`${BASE}/location`);
  url.searchParams.set("session_key", String(sessionKey));
  if (params.driverNumber != null)
    url.searchParams.set("driver_number", String(params.driverNumber));
  if (params.dateGt) url.searchParams.set("date>", params.dateGt);
  if (params.dateLt) url.searchParams.set("date<", params.dateLt);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as LocationRaw[];
}

function addSeconds(iso: string, seconds: number): string {
  const d = new Date(iso);
  d.setUTCSeconds(d.getUTCSeconds() + seconds);
  return d.toISOString();
}

export async function getTrackMap(): Promise<TrackMap | null> {
  const session = await getLatestSession();
  if (!session) return null;
  const outline = await memo<TrackOutline | null>(`openf1:track:outline:${session.session_key}`, 86400, async () => {
    const { timing } = await getTiming();
    const leader = timing[0]?.driver_number ?? null;
    if (leader == null) return null;
    let rows: LocationRaw[] = [];
    for (const offsetMin of [20, 50, 5]) {
      const start = addSeconds(session.date_start, offsetMin * 60);
      const end = addSeconds(start, 110);
      rows = await getLocation(session.session_key, {
        driverNumber: leader,
        dateGt: start,
        dateLt: end,
      });
      if (rows.length > 50) break;
    }
    const pts: Array<[number, number]> = [];
    for (const r of rows) {
      if (r.x != null && r.y != null) pts.push([r.x, r.y]);
    }
    if (pts.length > 200) {
      const step = Math.max(1, Math.floor(pts.length / 200));
      const sampled: Array<[number, number]> = [];
      for (let i = 0; i < pts.length; i += step) sampled.push(pts[i]);
      pts.splice(0, pts.length, ...sampled);
    }
    if (!pts.length) return null;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return {
      session_key: session.session_key,
      driver_number: leader,
      points: pts,
      bounds: {
        min_x: Math.min(...xs),
        max_x: Math.max(...xs),
        min_y: Math.min(...ys),
        max_y: Math.max(...ys),
      },
    };
  });
  if (!outline) return null;

  const positions = await memo<TrackPosition[]>(`openf1:track:positions:${session.session_key}`, 5, async () => {
    const end = session.date_end ?? session.date_start;
    const start = addSeconds(end, -15);
    const rows = await getLocation(session.session_key, { dateGt: start, dateLt: end });
    const latest = new Map<number, LocationRaw>();
    for (const r of rows) {
      if (r.x == null || r.y == null) continue;
      const prev = latest.get(r.driver_number);
      if (!prev || r.date > prev.date) latest.set(r.driver_number, r);
    }
    const { drivers } = await loadRawForSession(session.session_key);
    const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
    const { timing } = await getTiming();
    const timingByNum = new Map(timing.map((t) => [t.driver_number, t]));
    const out: TrackPosition[] = [];
    for (const [dn, r] of latest.entries()) {
      const info = driverMap.get(dn);
      const t = timingByNum.get(dn);
      out.push({
        driver_number: dn,
        x: r.x!,
        y: r.y!,
        team_colour: info?.team_colour ?? null,
        name_acronym: info?.name_acronym ?? null,
        full_name: info?.full_name ?? null,
        position: t?.position ?? null,
      });
    }
    out.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    return out;
  });

  return { session_key: session.session_key, outline, positions };
}

export async function getTelemetry(driverNumber: number): Promise<TelemetryFrame> {
  const session = await getLatestSession();
  if (!session) throw new Error("no session");
  const cached = await memo(`openf1:car_data:${session.session_key}:${driverNumber}`, 5, () =>
    get<CarDataRaw>("/car_data", {
      session_key: session.session_key,
      driver_number: driverNumber,
    }),
  );
  if (!cached.length) throw new Error("no car_data");
  const latest = cached[cached.length - 1];
  return {
    driver_number: driverNumber,
    timestamp: Date.now() / 1000,
    throttle: latest.throttle,
    brake: latest.brake,
    drs: latest.drs,
    n_gear: latest.n_gear,
    rpm: latest.rpm,
    speed: latest.speed,
  };
}
