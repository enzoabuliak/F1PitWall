"use client";

import { Countdown } from "./Countdown";
import { formatDateTimeShort } from "@/lib/format";
import type { ScheduleRace } from "@/lib/types";

interface Props {
  race: ScheduleRace;
}

const SESSION_LABELS: Array<{ key: keyof ScheduleRace["sessions"]; label: string }> = [
  { key: "fp1", label: "Practice 1" },
  { key: "fp2", label: "Practice 2" },
  { key: "fp3", label: "Practice 3" },
  { key: "sprint", label: "Sprint" },
  { key: "qualifying", label: "Qualifying" },
  { key: "race", label: "Race" },
];

export function NextRaceCard({ race }: Props) {
  const sessions = SESSION_LABELS.filter((s) => race.sessions[s.key]);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">
          Round {race.round} · Next Race
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {race.race_name}
          </h1>
          {race.country && (
            <span className="text-sm font-mono uppercase tracking-[0.2em] text-neutral-400">
              {race.country}
              {race.locality ? ` · ${race.locality}` : ""}
            </span>
          )}
        </div>
        {race.circuit_name && (
          <div className="text-sm text-neutral-400 font-mono">{race.circuit_name}</div>
        )}
      </div>

      <div className="rounded-lg bg-gradient-to-r from-[#DC0000]/10 via-black/30 to-transparent border border-[#DC0000]/30 p-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#DC0000] font-bold mb-3">
          Lights out in
        </div>
        <Countdown target={race.sessions.race} label={`${race.race_name} race`} />
        <div className="mt-4 text-xs text-neutral-400 font-mono">
          {formatDateTimeShort(race.sessions.race)}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold mb-2">
          Race weekend schedule
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sessions.map((s) => (
            <li
              key={s.key}
              className="flex items-center justify-between rounded border border-white/5 bg-black/30 px-3 py-2"
            >
              <span className="text-xs uppercase tracking-[0.15em] text-neutral-400 font-bold">
                {s.label}
              </span>
              <span className="text-xs font-mono text-white">
                {formatDateTimeShort(race.sessions[s.key])}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
