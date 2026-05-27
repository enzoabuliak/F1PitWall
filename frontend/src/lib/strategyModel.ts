import type {
  DriverPosition,
  DriverStrategy,
  StrategyResponse,
} from "./types";

/**
 * Typical optimal stint length per compound (laps). These are
 * approximations from current-generation Pirelli compounds — actual
 * varies by circuit abrasiveness, temperature, fuel load. Used only as
 * the basis for predicted pit windows when we don't have circuit-
 * specific data.
 */
export const STINT_LENGTH: Record<string, [number, number]> = {
  SOFT: [16, 22],
  MEDIUM: [22, 30],
  HARD: [30, 42],
  INTERMEDIATE: [20, 30],
  WET: [15, 25],
};

/** Average pit-lane loss across modern circuits (seconds). */
export const PIT_LOSS_SECONDS = 22;

/** Pace delta vs a fresh tire after `age` laps on a given compound. */
export function tireDelta(compound: string | null, age: number): number {
  if (!compound) return 0;
  const c = compound.toUpperCase();
  // Linear deg model: SOFT 0.08s/lap, MEDIUM 0.05, HARD 0.03
  const slope: Record<string, number> = {
    SOFT: 0.08,
    MEDIUM: 0.05,
    HARD: 0.035,
    INTERMEDIATE: 0.06,
    WET: 0.06,
  };
  return (slope[c] ?? 0.05) * age;
}

export interface PitWindow {
  driver_number: number;
  current_compound: string | null;
  current_age: number;
  earliest_lap_to_pit: number | null;
  latest_lap_to_pit: number | null;
  urgency: "now" | "soon" | "ok" | "fresh" | "unknown";
}

/**
 * Estimate when each driver's current stint should ideally end based on
 * compound + tire age. Returns null bounds if we can't tell.
 */
export function predictPitWindow(driver: DriverStrategy, currentLap: number): PitWindow {
  const last = driver.stints[driver.stints.length - 1];
  const compound = last?.compound ?? null;
  const stintStartLap = last?.lap_start ?? null;
  const lapStart = stintStartLap ?? Math.max(0, currentLap);
  const ageInStint = Math.max(0, currentLap - lapStart);
  const startTireAge = last?.tyre_age_at_start ?? 0;
  const totalAge = ageInStint + startTireAge;

  const range = STINT_LENGTH[(compound ?? "").toUpperCase()];
  if (!range || !stintStartLap) {
    return {
      driver_number: driver.driver_number,
      current_compound: compound,
      current_age: totalAge,
      earliest_lap_to_pit: null,
      latest_lap_to_pit: null,
      urgency: "unknown",
    };
  }
  const [earlyLen, lateLen] = range;
  const earliest = stintStartLap + Math.max(0, earlyLen - startTireAge);
  const latest = stintStartLap + Math.max(0, lateLen - startTireAge);
  let urgency: PitWindow["urgency"] = "ok";
  if (currentLap > latest) urgency = "now";
  else if (currentLap >= earliest) urgency = "soon";
  else if (totalAge < 5) urgency = "fresh";
  return {
    driver_number: driver.driver_number,
    current_compound: compound,
    current_age: totalAge,
    earliest_lap_to_pit: earliest,
    latest_lap_to_pit: latest,
    urgency,
  };
}

export interface Threat {
  type: "undercut" | "overcut";
  ahead: DriverPosition;
  behind: DriverPosition;
  gap_seconds: number;
  tire_age_delta: number; // positive: behind has fresher tires
  estimated_gain_seconds: number;
  rationale: string;
}

/**
 * Walk the timing tower top-to-bottom. For each adjacent pair, if the
 * trailing car has notably fresher tires and is within striking range,
 * flag an undercut (they pit first → fast new-tire laps to leapfrog) or
 * overcut (they extend, ahead pits, they exploit fresher rubber on the
 * older compound).
 */
export function detectThreats(
  positions: DriverPosition[],
  strategy: StrategyResponse | null,
  currentLap: number,
): Threat[] {
  if (!positions.length) return [];
  const stratByDriver = new Map<number, DriverStrategy>();
  if (strategy) {
    for (const d of strategy.drivers) stratByDriver.set(d.driver_number, d);
  }
  function ageFor(p: DriverPosition): number {
    const s = stratByDriver.get(p.driver_number);
    if (!s || !s.stints.length) return p.tire_age ?? 0;
    const last = s.stints[s.stints.length - 1];
    const startLap = last.lap_start ?? 0;
    const startAge = last.tyre_age_at_start ?? 0;
    return Math.max(0, currentLap - startLap) + startAge;
  }
  const threats: Threat[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const ahead = positions[i];
    const behind = positions[i + 1];
    const gap = behind.gap_to_next;
    if (gap == null || gap <= 0 || gap > 5) continue;
    const aAge = ageFor(ahead);
    const bAge = ageFor(behind);
    const delta = aAge - bAge; // positive: behind is fresher
    if (Math.abs(delta) < 3) continue;
    if (delta > 0) {
      // behind has fresher tires
      const perLapGain =
        tireDelta(ahead.tire_compound, aAge) - tireDelta(behind.tire_compound, bAge);
      // pit 1 lap earlier, run 3 fast laps before ahead pits
      const projectedGain = perLapGain * 3 - 0.5;
      if (projectedGain > 0.2) {
        threats.push({
          type: "undercut",
          ahead,
          behind,
          gap_seconds: gap,
          tire_age_delta: delta,
          estimated_gain_seconds: projectedGain,
          rationale: `${behind.full_name?.split(" ").pop() ?? "Behind"} is ${delta.toFixed(0)} laps fresher on ${behind.tire_compound ?? "?"} — pitting now nets ~${projectedGain.toFixed(1)}s over ${ahead.full_name?.split(" ").pop() ?? "ahead"}`,
        });
      }
    } else {
      // behind has older tires — overcut threat (extend stint, jump ahead when they pit)
      const perLapGain =
        tireDelta(behind.tire_compound, bAge) - tireDelta(ahead.tire_compound, aAge);
      const projectedGain = Math.abs(perLapGain) * 2;
      if (projectedGain > 0.2) {
        threats.push({
          type: "overcut",
          ahead,
          behind,
          gap_seconds: gap,
          tire_age_delta: delta,
          estimated_gain_seconds: projectedGain,
          rationale: `${behind.full_name?.split(" ").pop() ?? "Behind"} on ${behind.tire_compound ?? "?"} can extend the stint; ${ahead.full_name?.split(" ").pop() ?? "ahead"} pits first → fresh rubber jumps in front`,
        });
      }
    }
  }
  return threats.sort((a, b) => b.estimated_gain_seconds - a.estimated_gain_seconds);
}

/**
 * Compute the current lap number across the field as the max stint
 * lap_end (most up-to-date lap any driver has completed).
 */
export function currentLap(strategy: StrategyResponse | null): number {
  if (!strategy) return 0;
  let max = 0;
  for (const d of strategy.drivers) {
    for (const s of d.stints) {
      if (s.lap_end != null && s.lap_end > max) max = s.lap_end;
    }
  }
  return max;
}
