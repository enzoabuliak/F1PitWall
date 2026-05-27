"use client";

import { useEffect, useState } from "react";
import { fetchStrategy } from "@/lib/api";
import { useTimingStore } from "@/stores/timingStore";
import type { StrategyResponse } from "@/lib/types";
import {
  currentLap,
  detectThreats,
  predictPitWindow,
  STINT_LENGTH,
} from "@/lib/strategyModel";
import { cn } from "@/lib/cn";
import { teamColor } from "@/lib/teamColors";

const URGENCY_STYLE: Record<string, { label: string; color: string; bar: string }> = {
  now: { label: "PIT NOW", color: "text-[#FF6868]", bar: "bg-[#DC0000]" },
  soon: { label: "Pit soon", color: "text-[#FFD15C]", bar: "bg-[#FFD15C]" },
  ok: { label: "On window", color: "text-[#00ff9c]", bar: "bg-[#00ff9c]" },
  fresh: { label: "Fresh tires", color: "text-[#3FA9F5]", bar: "bg-[#3FA9F5]" },
  unknown: { label: "—", color: "text-neutral-500", bar: "bg-neutral-700" },
};

export function StrategyAdvisor() {
  const [data, setData] = useState<StrategyResponse | null>(null);
  const positions = useTimingStore((s) => s.positions);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const s = await fetchStrategy();
      if (!cancelled) setData(s);
    }
    load();
    const id = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const lap = currentLap(data);
  const threats = detectThreats(positions, data, lap);

  if (!data) {
    return (
      <div className="text-xs text-neutral-500 font-mono animate-pulse">
        Loading strategy model…
      </div>
    );
  }

  const windows = data.drivers.map((d) => predictPitWindow(d, lap));

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold mb-2">
          Undercut / Overcut watch
        </div>
        {threats.length === 0 ? (
          <div className="text-xs text-neutral-500 font-mono py-2">
            No strategic threats inside 5 seconds
          </div>
        ) : (
          <ol className="space-y-2">
            {threats.slice(0, 6).map((t, i) => (
              <li
                key={`${t.ahead.driver_number}-${t.behind.driver_number}-${i}`}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs",
                  t.type === "undercut"
                    ? "border-[#FF6868]/40 bg-[#DC0000]/10"
                    : "border-[#3FA9F5]/40 bg-[#3FA9F5]/8",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "font-mono font-black uppercase tracking-[0.18em] text-[10px]",
                      t.type === "undercut" ? "text-[#FF6868]" : "text-[#3FA9F5]",
                    )}
                  >
                    {t.type}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-300 tabular-nums">
                    +{t.estimated_gain_seconds.toFixed(1)}s · gap {t.gap_seconds.toFixed(1)}s
                  </span>
                </div>
                <div className="text-neutral-200 leading-snug">{t.rationale}</div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">
            Predicted pit windows
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 font-mono">
            current lap · {lap || "—"}
          </div>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <ol className="space-y-1 min-w-[560px]" role="list">
            {data.drivers.map((d) => {
              const w = windows.find((x) => x.driver_number === d.driver_number);
              const urgency = URGENCY_STYLE[w?.urgency ?? "unknown"];
              const colour = teamColor(d.team_name, 0);
              return (
                <li
                  key={d.driver_number}
                  className="grid grid-cols-[28px_44px_1fr_60px_140px_90px] gap-2 items-center px-3 py-1.5 rounded border border-white/5 bg-black/30 text-xs"
                >
                  <span className="font-mono text-neutral-500 text-right">
                    P{d.position ?? "—"}
                  </span>
                  <span className="font-mono text-neutral-400">#{d.driver_number}</span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-1 h-5 rounded-sm" style={{ backgroundColor: colour }} />
                    <span className="text-white truncate font-medium">
                      {d.name_acronym ?? d.full_name?.split(" ").pop()}
                    </span>
                  </span>
                  <span className="font-mono text-neutral-300 text-right">
                    {w?.current_compound ?? "—"} L{w?.current_age ?? "—"}
                  </span>
                  <span className="font-mono text-neutral-400 text-right">
                    {w?.earliest_lap_to_pit != null && w?.latest_lap_to_pit != null
                      ? `L${w.earliest_lap_to_pit}–L${w.latest_lap_to_pit}`
                      : "—"}
                  </span>
                  <span
                    className={cn(
                      "text-right font-mono font-bold uppercase tracking-[0.15em] text-[10px]",
                      urgency.color,
                    )}
                  >
                    {urgency.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="text-[10px] text-neutral-600 leading-relaxed font-mono">
        Model: linear tire-deg slope per compound (SOFT 0.08, MEDIUM 0.05,
        HARD 0.035 s/lap), pit-loss 22s, recommended stint length
        {" "}
        {Object.entries(STINT_LENGTH)
          .map(([c, r]) => `${c[0]}=${r[0]}-${r[1]}`)
          .join(" · ")}
        . Undercut/overcut threats fire when the gap is ≤5s and tire age
        differs by ≥3 laps.
      </div>
    </div>
  );
}
