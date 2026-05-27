"use client";

import type { ConstructorStanding, DriverStanding } from "@/lib/types";

interface DriverProps {
  rows: DriverStanding[];
}

export function DriverStandingsMini({ rows }: DriverProps) {
  if (!rows.length) {
    return <div className="text-xs text-neutral-500 font-mono">No standings</div>;
  }
  const leader = rows[0]?.points ?? 0;
  return (
    <ol className="space-y-1">
      {rows.slice(0, 5).map((r) => {
        const gap = leader - r.points;
        return (
          <li
            key={r.position}
            className="flex items-center justify-between px-2 py-1.5 rounded text-xs font-mono hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-neutral-500 w-5 text-right">P{r.position}</span>
              <span className="text-white truncate">{r.full_name}</span>
            </span>
            <span className="flex items-baseline gap-2">
              {gap > 0 ? (
                <span className="text-neutral-500 text-[10px]">
                  -{gap.toFixed(0)}
                </span>
              ) : (
                <span className="text-[#FFD15C] text-[10px]">LEADER</span>
              )}
              <span className="text-[#00ff9c] tabular-nums w-10 text-right">
                {r.points}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ConstructorStandingsMini({ rows }: { rows: ConstructorStanding[] }) {
  if (!rows.length) {
    return <div className="text-xs text-neutral-500 font-mono">No standings</div>;
  }
  const leader = rows[0]?.points ?? 0;
  return (
    <ol className="space-y-1">
      {rows.slice(0, 5).map((r) => {
        const gap = leader - r.points;
        return (
          <li
            key={r.position}
            className="flex items-center justify-between px-2 py-1.5 rounded text-xs font-mono hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-neutral-500 w-5 text-right">P{r.position}</span>
              <span className="text-white truncate">{r.team_name}</span>
            </span>
            <span className="flex items-baseline gap-2">
              {gap > 0 ? (
                <span className="text-neutral-500 text-[10px]">
                  -{gap.toFixed(0)}
                </span>
              ) : (
                <span className="text-[#FFD15C] text-[10px]">LEADER</span>
              )}
              <span className="text-[#00ff9c] tabular-nums w-10 text-right">
                {r.points}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
