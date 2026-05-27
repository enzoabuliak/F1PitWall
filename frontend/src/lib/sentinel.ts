/**
 * OpenF1 occasionally reports nonsense telemetry frames at the very
 * tail of a session ("flush" packets): throttle=brake=100+, speed=0,
 * RPM=0, gear=0. Rendering those literally makes a finished-race
 * Replay view look broken. This helper recognises the pattern so we
 * can show em-dashes instead.
 */

import type { TelemetryFrame } from "./types";

const SENTINEL_HIGH = 100; // values above this are illegal for % fields

export function isSentinelTelemetry(f: TelemetryFrame | null | undefined): boolean {
  if (!f) return false;
  const throttleBad = f.throttle != null && f.throttle > SENTINEL_HIGH;
  const brakeBad = f.brake != null && f.brake > SENTINEL_HIGH;
  const speedZero = f.speed === 0 || f.speed == null;
  const rpmZero = f.rpm === 0 || f.rpm == null;
  const gearZero = f.n_gear === 0 || f.n_gear == null;
  // Match the "flush packet" pattern: throttle & brake both >100% AND
  // the car is reporting zero motion. That's not physically possible.
  return throttleBad && brakeBad && speedZero && rpmZero && gearZero;
}

/**
 * Convenience: scrub a single numeric field if the frame as a whole is
 * a sentinel. Use this in cells that want to display a real number or
 * em-dash.
 */
export function scrubValue<T extends number | null | undefined>(
  frame: TelemetryFrame | null | undefined,
  value: T,
): T | null {
  if (isSentinelTelemetry(frame)) return null;
  return value;
}
