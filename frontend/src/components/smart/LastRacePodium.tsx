"use client";

import { formatDate } from "@/lib/format";
import type { LastRaceResults } from "@/lib/types";

interface Props {
  result: LastRaceResults | null;
}

const PODIUM_GLOW = ["#FFD15C", "#D2D2D2", "#B58457"];

export function LastRacePodium({ result }: Props) {
  if (!result) {
    return (
      <div className="text-xs text-neutral-500 font-mono py-6 text-center">
        No completed race yet this season
      </div>
    );
  }
  const podium = result.results.slice(0, 3);
  const fullField = result.results.slice(0, 10);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-bold text-white">{result.race_name}</div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">
          {result.country} · {formatDate(result.date)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {podium.map((r, i) => (
          <div
            key={r.position}
            className="rounded-md border border-white/10 bg-black/40 px-3 py-3 text-center"
            style={{ boxShadow: `inset 0 2px 0 ${PODIUM_GLOW[i]}` }}
          >
            <div
              className="text-3xl font-mono font-black"
              style={{ color: PODIUM_GLOW[i] }}
            >
              {r.position}
            </div>
            <div className="text-xs text-white font-bold truncate">
              {r.driver_code ?? r.full_name.split(" ").pop()}
            </div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-500 truncate mt-0.5">
              {r.team_name ?? "—"}
            </div>
          </div>
        ))}
      </div>

      {fullField.length > 3 && (
        <ol className="space-y-px text-xs font-mono">
          {fullField.slice(3).map((r) => (
            <li
              key={r.position}
              className="flex items-center justify-between px-2 py-1.5 rounded text-neutral-400 hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-5 text-neutral-600 text-right">{r.position}</span>
                <span className="truncate text-white">
                  {r.driver_code ? `${r.driver_code} · ` : ""}
                  {r.full_name}
                </span>
              </span>
              <span className="text-[#00ff9c]">{r.points}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
