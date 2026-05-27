"use client";

import { useEffect, useState } from "react";
import { fetchStrategy } from "@/lib/api";
import type { StrategyResponse } from "@/lib/types";
import { teamColor } from "@/lib/teamColors";

interface TeamRow {
  team_name: string;
  stops: number;
  drivers: number;
}

function rollup(data: StrategyResponse | null): TeamRow[] {
  if (!data) return [];
  const acc = new Map<string, TeamRow>();
  for (const d of data.drivers) {
    const team = d.team_name ?? "Unknown";
    if (!acc.has(team)) {
      acc.set(team, { team_name: team, stops: 0, drivers: 0 });
    }
    const row = acc.get(team)!;
    row.stops += d.pit_stops;
    row.drivers += 1;
  }
  return [...acc.values()].sort((a, b) => b.stops - a.stops || a.team_name.localeCompare(b.team_name));
}

export function PitStopRankings() {
  const [data, setData] = useState<StrategyResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const s = await fetchStrategy();
      if (!cancelled) setData(s);
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return <div className="text-xs text-neutral-500 font-mono animate-pulse">Loading…</div>;
  }
  const rows = rollup(data);
  if (!rows.length) {
    return <div className="text-xs text-neutral-500 font-mono">No data</div>;
  }
  const max = rows[0]?.stops || 1;

  return (
    <ol className="space-y-1" role="list" aria-label="Team pit stop counts">
      {rows.map((r, i) => {
        const colour = teamColor(r.team_name, i);
        const width = `${(r.stops / max) * 100}%`;
        const avg = r.drivers ? (r.stops / r.drivers).toFixed(1) : "—";
        return (
          <li
            key={r.team_name}
            className="grid grid-cols-[1fr_60px_40px] gap-2 items-center text-xs font-mono px-2 py-1.5 rounded hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1 h-4 rounded-sm shrink-0" style={{ backgroundColor: colour }} />
              <span className="text-white truncate">{r.team_name}</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width, backgroundColor: colour }}
              />
            </div>
            <span className="text-right text-[#00ff9c] tabular-nums">
              {r.stops}
              <span className="text-neutral-500 text-[10px] ml-1">/{avg}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
