"use client";

import { useRaceStore } from "@/stores/raceStore";
import { formatDate } from "@/lib/format";

export function ReplayBanner() {
  const race = useRaceStore((s) => s.raceState);
  const status = race?.session_status;

  if (status === "live" || !race) return null;

  const label =
    status === "upcoming"
      ? "Pre-session"
      : status === "finished"
        ? "Replay"
        : "Archive";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-neutral-300 bg-neutral-900/80 border-b border-white/10"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-500" />
      <span>{label}</span>
      <span className="text-neutral-500 normal-case tracking-normal font-mono text-[11px]">
        Showing data from {race.session_name ?? "the most recent session"}
        {race.country ? ` · ${race.country}` : ""}
        {race.date_start ? ` · ${formatDate(race.date_start)}` : ""}.
        Live updates resume when the next session starts.
      </span>
    </div>
  );
}
