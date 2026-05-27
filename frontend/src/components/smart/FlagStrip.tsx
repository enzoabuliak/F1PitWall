"use client";

import { useRaceControl } from "@/hooks/useRaceControl";
import { useRaceStore } from "@/stores/raceStore";
import type { FlagState } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATE_STYLES: Record<
  FlagState,
  { bg: string; border: string; text: string; icon: string; pulse: boolean; label: string }
> = {
  GREEN: {
    bg: "bg-[#00ff9c]/10",
    border: "border-[#00ff9c]/40",
    text: "text-[#00ff9c]",
    icon: "■",
    pulse: false,
    label: "Track Clear",
  },
  YELLOW: {
    bg: "bg-[#FFD15C]/15",
    border: "border-[#FFD15C]/50",
    text: "text-[#FFD15C]",
    icon: "▲",
    pulse: true,
    label: "Yellow Flag",
  },
  DOUBLE_YELLOW: {
    bg: "bg-[#FFD15C]/20",
    border: "border-[#FFD15C]/60",
    text: "text-[#FFD15C]",
    icon: "▲▲",
    pulse: true,
    label: "Double Yellow",
  },
  RED: {
    bg: "bg-[#DC0000]/20",
    border: "border-[#DC0000]/70",
    text: "text-[#FF6868]",
    icon: "■",
    pulse: true,
    label: "Red Flag",
  },
  SC: {
    bg: "bg-[#FFD15C]/15",
    border: "border-[#FFD15C]/50",
    text: "text-[#FFD15C]",
    icon: "SC",
    pulse: true,
    label: "Safety Car",
  },
  VSC: {
    bg: "bg-[#FFD15C]/10",
    border: "border-[#FFD15C]/40",
    text: "text-[#FFD15C]",
    icon: "VSC",
    pulse: true,
    label: "Virtual Safety Car",
  },
  CHEQUERED: {
    bg: "bg-white/5",
    border: "border-white/20",
    text: "text-white",
    icon: "▥",
    pulse: false,
    label: "Chequered Flag",
  },
};

export function FlagStrip() {
  const rc = useRaceControl(8000);
  const session = useRaceStore((s) => s.raceState);

  if (!rc) return null;
  const stateInfo = STATE_STYLES[rc.overall.state] ?? STATE_STYLES.GREEN;
  const isLive = session?.session_status === "live";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 px-4 py-2 border-b text-xs uppercase tracking-[0.2em]",
        stateInfo.bg,
        stateInfo.border,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center min-w-[44px] h-6 px-2 rounded font-mono font-black",
          stateInfo.text,
          stateInfo.pulse && isLive ? "animate-pulse" : "",
        )}
        aria-hidden="true"
      >
        {stateInfo.icon}
      </span>
      <span className={cn("font-bold", stateInfo.text)}>{stateInfo.label}</span>
      <span className="text-neutral-400 normal-case tracking-normal font-mono text-[11px] truncate flex-1">
        {rc.messages[0]?.message ?? rc.overall.label}
      </span>
      {!isLive && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono shrink-0">
          last session
        </span>
      )}
    </div>
  );
}
