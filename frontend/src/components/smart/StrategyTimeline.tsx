"use client";

import { useEffect, useState } from "react";
import { fetchStrategy } from "@/lib/api";
import type { DriverStrategy, Stint, StrategyResponse } from "@/lib/types";

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "#FF4747",
  MEDIUM: "#FFD15C",
  HARD: "#F8F8F8",
  INTERMEDIATE: "#3FB364",
  WET: "#3FA9F5",
  UNKNOWN: "#666",
};

function compoundClass(c: string | null): string {
  if (!c) return "UNKNOWN";
  return c.toUpperCase();
}

function compoundLetter(c: string | null): string {
  if (!c) return "?";
  return c[0].toUpperCase();
}

export function StrategyTimeline() {
  const [data, setData] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const s = await fetchStrategy();
      if (cancelled) return;
      setData(s);
      setLoading(false);
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (loading && !data) {
    return <SkeletonRows />;
  }
  if (!data || !data.drivers.length) {
    return (
      <div className="text-xs text-neutral-500 font-mono py-6 text-center">
        Strategy data unavailable
      </div>
    );
  }

  const maxLap = Math.max(data.max_lap, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold pb-2 border-b border-white/5">
        <span>Compound legend</span>
        {Object.entries(COMPOUND_COLOR)
          .filter(([k]) => k !== "UNKNOWN")
          .map(([k, c]) => (
            <span key={k} className="flex items-center gap-1.5 normal-case">
              <span
                className="inline-block w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: c }}
              />
              <span className="text-neutral-300 tracking-normal">{k}</span>
            </span>
          ))}
        <span className="ml-auto text-neutral-500 font-mono normal-case tracking-normal">
          {maxLap} laps total
        </span>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <ol className="space-y-2 min-w-[640px]" role="list" aria-label="Tire strategy per driver">
          {data.drivers.map((d) => (
            <DriverRow key={d.driver_number} driver={d} maxLap={maxLap} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function DriverRow({ driver, maxLap }: { driver: DriverStrategy; maxLap: number }) {
  const teamStripe = driver.team_colour ? `#${driver.team_colour}` : "#666";
  return (
    <li className="grid grid-cols-[180px_1fr_70px] gap-3 items-center text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-1 h-7 rounded-sm" style={{ backgroundColor: teamStripe }} />
        <span className="text-neutral-500 w-6 text-right font-mono tabular-nums">
          P{driver.position ?? "—"}
        </span>
        <span className="text-neutral-400 font-mono w-7">#{driver.driver_number}</span>
        <span className="text-white truncate font-medium">
          {driver.name_acronym ?? driver.full_name?.split(" ").pop()}
        </span>
      </div>
      <div className="relative h-7 rounded-md bg-black/40 border border-white/5 overflow-hidden">
        {driver.stints.map((s, i) => (
          <StintBar key={i} stint={s} maxLap={maxLap} />
        ))}
      </div>
      <div className="text-right text-neutral-400 font-mono tabular-nums">
        <span className="text-white">{driver.pit_stops}</span> stop
        {driver.pit_stops === 1 ? "" : "s"}
      </div>
    </li>
  );
}

function StintBar({ stint, maxLap }: { stint: Stint; maxLap: number }) {
  const start = Math.max(0, stint.lap_start ?? 0);
  const end = Math.max(start, stint.lap_end ?? start);
  const left = (start / maxLap) * 100;
  const width = Math.max(((end - start) / maxLap) * 100, 0.5);
  const key = compoundClass(stint.compound);
  const color = COMPOUND_COLOR[key] ?? COMPOUND_COLOR.UNKNOWN;
  return (
    <div
      className="absolute top-0 bottom-0 flex items-center justify-center text-[10px] font-mono font-black text-black"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: color,
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.3)",
      }}
      title={`${stint.compound ?? "?"} · L${stint.lap_start ?? "?"}–L${stint.lap_end ?? "?"} (${(end - start) || 0} laps)`}
    >
      {width > 4 ? compoundLetter(stint.compound) : ""}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[180px_1fr_70px] gap-3">
          <div className="h-6 rounded bg-white/5" />
          <div className="h-7 rounded bg-white/5" />
          <div className="h-6 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
