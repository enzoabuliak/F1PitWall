"use client";

import { cn } from "@/lib/cn";
import type { ScheduleRace } from "@/lib/types";

interface Props {
  schedule: ScheduleRace[];
  nowIso: string;
  nextRound?: number | null;
}

export function CalendarStrip({ schedule, nowIso, nextRound }: Props) {
  if (!schedule.length) return null;
  const now = nowIso;
  return (
    <div
      role="list"
      aria-label="Season calendar"
      className="flex items-stretch gap-1 overflow-x-auto py-1 pr-2 -mx-1 px-1"
    >
      {schedule.map((r) => {
        const start = r.race_start ?? `${r.date}T00:00:00Z`;
        const past = start <= now;
        const next = nextRound != null && r.round === nextRound;
        return (
          <div
            role="listitem"
            key={r.round}
            title={`R${r.round} ${r.race_name} — ${r.date ?? ""}`}
            className={cn(
              "flex-shrink-0 flex flex-col items-center justify-end gap-1 px-2 py-2 rounded-md border min-w-[44px] transition-colors",
              next
                ? "border-[#DC0000]/70 bg-[#DC0000]/15 shadow-[0_0_12px_rgba(220,0,0,0.35)]"
                : past
                  ? "border-white/5 bg-white/[0.02] text-neutral-500"
                  : "border-white/10 bg-black/30 text-neutral-300",
            )}
          >
            <span
              className={cn(
                "text-[9px] font-mono uppercase tracking-[0.15em]",
                next ? "text-white" : past ? "text-neutral-600" : "text-neutral-500",
              )}
            >
              R{r.round}
            </span>
            <span
              className={cn(
                "h-1 w-6 rounded-full",
                next ? "bg-[#DC0000]" : past ? "bg-neutral-700" : "bg-white/20",
              )}
            />
            <span
              className={cn(
                "text-[9px] font-mono uppercase tracking-[0.15em] truncate max-w-[44px]",
                next ? "text-[#DC0000] font-bold" : "text-neutral-500",
              )}
            >
              {threeLetter(r.country)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function threeLetter(country: string | null): string {
  if (!country) return "—";
  const map: Record<string, string> = {
    Australia: "AUS",
    China: "CHN",
    Japan: "JPN",
    USA: "USA",
    "United States": "USA",
    Bahrain: "BHR",
    "Saudi Arabia": "SAU",
    Azerbaijan: "AZE",
    Spain: "ESP",
    Monaco: "MON",
    Canada: "CAN",
    Austria: "AUT",
    UK: "GBR",
    "United Kingdom": "GBR",
    Hungary: "HUN",
    Belgium: "BEL",
    Netherlands: "NED",
    Italy: "ITA",
    Singapore: "SIN",
    Mexico: "MEX",
    Brazil: "BRA",
    "United Arab Emirates": "UAE",
    UAE: "UAE",
    Qatar: "QAT",
  };
  return map[country] ?? country.slice(0, 3).toUpperCase();
}
