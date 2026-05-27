"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRaceStore } from "@/stores/raceStore";
import { useTimingStore } from "@/stores/timingStore";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/race", label: "Race" },
  { href: "/track", label: "Track" },
  { href: "/strategy", label: "Strategy" },
  { href: "/qualifying", label: "Quali" },
  { href: "/telemetry", label: "Telemetry" },
  { href: "/team", label: "Team" },
  { href: "/compare", label: "Compare" },
  { href: "/constructors", label: "Constructors" },
  { href: "/history", label: "History" },
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
  const effectiveKey =
    statusKey === "live" && !fresh
      ? "unknown"
      : statusKey === "unknown"
        ? "unknown"
        : statusKey;
  const status = STATUS_LABEL[effectiveKey] ?? STATUS_LABEL.unknown;

  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
        <Link
          href="/"
          aria-label="F1 Pit Wall home"
          className="flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#DC0000]/60 focus-visible:outline-offset-2"
        >
          <div className="h-7 w-7 rounded-sm bg-[#DC0000] flex items-center justify-center shadow-[0_0_12px_#DC0000]">
            <span className="text-xs font-black text-white">F1</span>
          </div>
          <span className="hidden sm:inline text-sm font-bold tracking-[0.2em] text-white">PIT WALL</span>
        </Link>

        <div className="hidden md:block h-6 w-px bg-white/10" />

        <div className="hidden lg:block min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Session</div>
          <div className="text-sm font-mono text-white truncate">
            {race?.session_name ?? "—"} · {race?.country ?? "—"} · {race?.circuit ?? "—"}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {race?.year && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
              {race.year}
            </span>
          )}
          <span className={cn("text-[10px] uppercase tracking-[0.2em] font-bold", status.color)}>
            {status.label}
          </span>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="flex items-center gap-1 overflow-x-auto px-4 sm:px-6 pb-2 -mt-1 scrollbar-thin"
      >
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 inline-flex items-center justify-center min-h-[36px] px-3 rounded-md text-[11px] uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC0000]/60",
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
    </header>
  );
}
