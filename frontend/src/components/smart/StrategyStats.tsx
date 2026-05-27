"use client";

import { useEffect, useState } from "react";
import { fetchStrategy } from "@/lib/api";
import type { StrategyResponse } from "@/lib/types";

export function StrategyStats() {
  const [data, setData] = useState<StrategyResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const s = await fetchStrategy();
      if (!cancelled) setData(s);
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return <div className="text-xs text-neutral-500 font-mono">Loading…</div>;
  }

  const totalDrivers = data.drivers.length;
  if (!totalDrivers) {
    return <div className="text-xs text-neutral-500 font-mono">No data</div>;
  }
  const totalStops = data.drivers.reduce((acc, d) => acc + d.pit_stops, 0);
  const avgStops = totalStops / totalDrivers;
  const onePlanners = data.drivers.filter((d) => d.pit_stops === 1).length;
  const twoPlanners = data.drivers.filter((d) => d.pit_stops === 2).length;
  const threePlanners = data.drivers.filter((d) => d.pit_stops >= 3).length;

  const compoundCounts: Record<string, number> = {};
  for (const d of data.drivers) {
    for (const s of d.stints) {
      const k = (s.compound ?? "UNKNOWN").toUpperCase();
      compoundCounts[k] = (compoundCounts[k] ?? 0) + 1;
    }
  }
  const compoundOrder = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"];
  const compounds = compoundOrder
    .filter((c) => compoundCounts[c])
    .map((c) => ({ name: c, count: compoundCounts[c] }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Avg stops" value={avgStops.toFixed(1)} />
        <Stat label="Race laps" value={String(data.max_lap)} />
        <Stat label="1-stoppers" value={String(onePlanners)} />
        <Stat label="2-stoppers" value={String(twoPlanners)} />
      </div>

      {threePlanners > 0 && (
        <div className="rounded bg-black/40 border border-white/5 px-3 py-2 text-xs font-mono text-neutral-400">
          <span className="text-[#DC0000] font-bold">{threePlanners}</span> driver
          {threePlanners === 1 ? "" : "s"} on 3+ stops
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-2">
          Compound usage
        </div>
        <ul className="space-y-1">
          {compounds.map((c) => (
            <li
              key={c.name}
              className="flex items-center justify-between text-xs font-mono"
            >
              <span className="text-neutral-300">{c.name}</span>
              <span className="text-white tabular-nums">{c.count} stints</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-black/40 border border-white/5 p-3">
      <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
        {label}
      </div>
      <div className="text-2xl font-mono font-black text-[#00ff9c] mt-1">
        {value}
      </div>
    </div>
  );
}
