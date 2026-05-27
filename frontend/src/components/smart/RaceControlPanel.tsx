"use client";

import { useRaceControl } from "@/hooks/useRaceControl";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { RaceControlMessage } from "@/lib/types";

function categoryStyle(m: RaceControlMessage) {
  const flag = (m.flag ?? "").toUpperCase();
  const cat = (m.category ?? "").toUpperCase();
  const msg = (m.message ?? "").toUpperCase();
  if (flag === "RED" || msg.includes("RED FLAG"))
    return "text-[#FF6868] border-[#DC0000]/40 bg-[#DC0000]/10";
  if (cat === "SAFETYCAR" || msg.includes("SAFETY CAR"))
    return "text-[#FFD15C] border-[#FFD15C]/40 bg-[#FFD15C]/8";
  if (flag === "YELLOW" || flag === "DOUBLE YELLOW")
    return "text-[#FFD15C] border-[#FFD15C]/30 bg-[#FFD15C]/5";
  if (flag === "GREEN")
    return "text-[#00ff9c] border-[#00ff9c]/30 bg-[#00ff9c]/5";
  if (cat === "DRS")
    return "text-[#3FA9F5] border-[#3FA9F5]/30 bg-[#3FA9F5]/5";
  if (cat === "FLAG")
    return "text-neutral-200 border-white/10 bg-white/[0.03]";
  return "text-neutral-300 border-white/10 bg-white/[0.03]";
}

function shortLabel(m: RaceControlMessage): string {
  if (m.flag) return m.flag.toUpperCase();
  if (m.category) return m.category.toUpperCase();
  return "MSG";
}

export function RaceControlPanel() {
  const rc = useRaceControl(8000);

  if (!rc) {
    return (
      <div className="text-xs text-neutral-500 font-mono animate-pulse">
        Loading race control…
      </div>
    );
  }
  if (!rc.messages.length) {
    return (
      <div className="text-xs text-neutral-500 font-mono py-4 text-center">
        No race-control messages recorded
      </div>
    );
  }

  return (
    <ol className="space-y-1 max-h-[480px] overflow-y-auto pr-1" role="log" aria-label="Race control messages">
      {rc.messages.map((m, i) => (
        <li
          key={`${m.date}-${i}`}
          className={cn(
            "flex items-start gap-3 px-3 py-2 rounded border text-xs",
            categoryStyle(m),
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] shrink-0 w-12 text-right pt-0.5">
            {formatTime(m.date)}
          </span>
          <span className="font-mono font-black uppercase tracking-[0.1em] shrink-0 min-w-[44px] text-[10px] pt-0.5">
            {shortLabel(m)}
          </span>
          <span className="text-neutral-200 leading-snug">
            {m.message ?? "(no message)"}
            {m.lap_number != null && (
              <span className="ml-2 text-[10px] text-neutral-500 font-mono">
                · L{m.lap_number}
              </span>
            )}
            {m.driver_acronym && (
              <span className="ml-1 text-[10px] text-neutral-400 font-mono">
                · {m.driver_acronym}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
