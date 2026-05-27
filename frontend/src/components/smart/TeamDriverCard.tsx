"use client";

import { useTelemetryPolling } from "@/hooks/useTelemetryPolling";
import { useTelemetryStore } from "@/stores/telemetryStore";
import type { DriverStanding, TeamDriver } from "@/lib/types";
import { TelemetryGraph, GearDrsPanel } from "./TelemetryGraph";

interface Props {
  driver: TeamDriver;
  teamColour: string | null;
  standing?: DriverStanding | null;
}

function formatLap(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(3);
  return m > 0 ? `${m}:${s.padStart(6, "0")}` : `${s}`;
}

export function TeamDriverCard({ driver, teamColour, standing }: Props) {
  useTelemetryPolling(driver.driver_number, 1500);
  const buffer = useTelemetryStore((s) => s.buffers.get(driver.driver_number));
  const latest = buffer?.[buffer.length - 1];
  const colour = teamColour ? `#${teamColour}` : "#666";

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/10"
        style={{ boxShadow: `inset 3px 0 0 ${colour}` }}
      >
        <div className="flex flex-col">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
            #{driver.driver_number} · {driver.name_acronym ?? "?"}
          </div>
          <div className="text-sm font-bold text-white">
            {driver.full_name ?? "Unknown"}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Pos
          </div>
          <div className="text-xl font-mono font-black text-[#00ff9c] leading-none">
            {driver.position ?? "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-white/5">
        <div className="bg-black/40 p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-500">Last lap</div>
          <div className="text-sm font-mono text-[#00ff9c]">
            {formatLap(driver.last_lap_time)}
          </div>
        </div>
        <div className="bg-black/40 p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-500">Tire</div>
          <div className="text-sm font-mono text-white">{driver.tire_compound ?? "—"}</div>
        </div>
        <div className="bg-black/40 p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-500">Champ</div>
          <div className="text-sm font-mono text-white">
            {standing ? `P${standing.position} · ${standing.points}` : "—"}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <GearDrsPanel driverNumber={driver.driver_number} />
        <div className="grid grid-cols-2 gap-2">
          <TelemetryGraph
            driverNumber={driver.driver_number}
            field="throttle"
            color="#00ff9c"
            label="Throttle"
            unit="%"
            domain={[0, 100]}
          />
          <TelemetryGraph
            driverNumber={driver.driver_number}
            field="brake"
            color="#DC0000"
            label="Brake"
            unit="%"
            domain={[0, 100]}
          />
          <TelemetryGraph
            driverNumber={driver.driver_number}
            field="speed"
            color="#3FA9F5"
            label="Speed"
            unit="km/h"
          />
          <TelemetryGraph
            driverNumber={driver.driver_number}
            field="rpm"
            color="#FFB800"
            label="RPM"
          />
        </div>
        <div className="text-[10px] font-mono text-neutral-500 text-right">
          {latest ? "● polling" : "○ no telemetry"}
        </div>
      </div>
    </div>
  );
}
