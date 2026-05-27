export interface DriverPosition {
  driver_number: number;
  position: number | null;
  full_name: string | null;
  team_name: string | null;
  team_colour: string | null;
  gap_to_leader: number | null;
  gap_to_next: number | null;
  sector1_time: number | null;
  sector2_time: number | null;
  sector3_time: number | null;
  last_lap_time: number | null;
  best_lap_time: number | null;
  pit: boolean | null;
  drs: boolean | null;
  tire_compound: "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | string | null;
  tire_age: number | null;
}

export interface Weather {
  air_temperature: number | null;
  track_temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  rainfall: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
}

export type SessionStatus = "live" | "upcoming" | "finished" | "unknown";

export interface RaceState {
  session_key: number | null;
  meeting_key: number | null;
  session_name: string | null;
  session_type: string | null;
  country: string | null;
  circuit: string | null;
  status: string | null;
  session_status: SessionStatus | null;
  flag_status: string | null;
  date_start: string | null;
  date_end: string | null;
  year: number | null;
}

export interface DriverStanding {
  position: number;
  driver_number: number | null;
  driver_code: string | null;
  full_name: string;
  team_name: string | null;
  points: number;
  wins: number;
}

export interface ConstructorStanding {
  position: number;
  team_name: string;
  nationality: string | null;
  points: number;
  wins: number;
}

export interface TeamDriver {
  driver_number: number;
  full_name: string | null;
  name_acronym: string | null;
  headshot_url: string | null;
  country_code: string | null;
  position: number | null;
  gap_to_leader: number | null;
  last_lap_time: number | null;
  tire_compound: string | null;
}

export interface Team {
  team_name: string;
  team_colour: string | null;
  drivers: TeamDriver[];
}

export interface RaceSessions {
  fp1: string | null;
  fp2: string | null;
  fp3: string | null;
  qualifying: string | null;
  sprint: string | null;
  race: string | null;
}

export interface ScheduleRace {
  round: number;
  race_name: string;
  circuit_name: string | null;
  circuit_id: string | null;
  country: string | null;
  locality: string | null;
  date: string | null;
  time: string | null;
  race_start: string | null;
  sessions: RaceSessions;
}

export interface ScheduleResponse {
  year: number;
  now: string;
  schedule: ScheduleRace[];
  next_race: ScheduleRace | null;
  last_race: ScheduleRace | null;
}

export interface RaceResult {
  position: number;
  driver_code: string | null;
  full_name: string;
  team_name: string | null;
  points: number;
  status: string | null;
  time: string | null;
}

export interface LastRaceResults {
  race_name: string;
  circuit: string | null;
  country: string | null;
  date: string | null;
  results: RaceResult[];
}

export interface TelemetryFrame {
  driver_number: number;
  timestamp: number;
  throttle: number | null;
  brake: number | null;
  drs: number | null;
  n_gear: number | null;
  rpm: number | null;
  speed: number | null;
}
