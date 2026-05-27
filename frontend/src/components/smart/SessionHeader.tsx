"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRaceStore } from "@/stores/raceStore";
import { useTimingStore } from "@/stores/timingStore";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/telemetry", label: "Telemetry" },
  { href: "/team", label: "Team" },
  { href: "/compare", label: "Compare" },
];

const STATUS_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  live: {
    label: "● LIVE",
    color: "text-[#00ff9c]",
    dot: "bg-[#00ff9c] shadow-[0_0_8px_#00ff9c]",
  },
  upcoming: {
    label: "○ UPCOMING",
    color: "text-[#FFB800]",
    dot: "bg-[#FFB800]",
  },
  finished: {
    label: "◼ REPLAY",
    color: "text-neutral-400",
    dot: "bg-neutral-500",
  },
  unknown: {
    label: "○ OFFLINE",
    color: "text-neutral-500",
    dot: "bg-neutral-700",
  },
};

export function SessionHeader() {
  const race = useRaceStore((s) => s.raceState);
  const lastUpdate = useTimingStore((s) => s.lastUpdate);
  const pathname = usePathname();
  const fresh = lastUpdate > 0 && Date.now() - lastUpdate < 10000;
  const statusKey = (race?.session_status as keyof typeof STATUS_LABEL) ?? "unknown";
  // "live" must be backed by fresh timing data; finished/upcoming reflect the race calendar
  // regardless of whether timing is flowing right now.
  const effectiveKey =
    statusKey === "live" && !fresh
      ? "unknown"
      : statusKey === "unknown"
        ? "unknown"
        : statusKey;
  const status = STATUS_LABEL[effectiveKey] ?? STATUS_LABEL.unknown;

  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-xl px-6 py-3">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-[#DC0000] flex items-center justify-center shadow-[0_0_12px_#DC0000]">
            <span className="text-xs font-black text-white">F1</span>
          </div>
          <span className="text-sm font-bold tracking-[0.2em] text-white">PIT WALL</span>
        </Link>
        <div className="h-6 w-px bg-white/10" />
        <nav className="flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-3 py-1 rounded-md text-[11px] uppercase tracking-[0.2em] font-bold transition-colors",
                  active
                    ? "bg-[#DC0000]/15 text-[#DC0000] shadow-[0_0_12px_rgba(220,0,0,0.3)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="h-6 w-px bg-white/10" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Session</div>
          <div className="text-sm font-mono text-white">
            {race?.session_name ?? "—"} · {race?.country ?? "—"} · {race?.circuit ?? "—"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {race?.year && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
            {race.year}
          </span>
        )}
        <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${status.color}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}
