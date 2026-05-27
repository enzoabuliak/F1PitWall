"use client";

import Link from "next/link";
import { useChampionship } from "@/hooks/useChampionship";
import { useSchedule } from "@/hooks/useSchedule";
import { CalendarStrip } from "./CalendarStrip";
import {
  ConstructorStandingsMini,
  DriverStandingsMini,
} from "./StandingsMini";
import { LastRacePodium } from "./LastRacePodium";
import { NextRaceCard } from "./NextRaceCard";
import { Panel } from "@/components/atoms/Panel";

export function HomeScreen() {
  const { schedule, lastRace, loading } = useSchedule();
  const { drivers, constructors, year } = useChampionship();

  if (loading && !schedule) {
    return (
      <div className="p-6">
        <Panel title="Loading season">
          <SkeletonHero />
        </Panel>
      </div>
    );
  }

  const next = schedule?.next_race ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      <div className="lg:col-span-2 space-y-4">
        <Panel
          accent={!!next}
          title={
            year
              ? `${year} Season · Between Rounds`
              : "Season · Between Rounds"
          }
        >
          {next ? (
            <NextRaceCard race={next} />
          ) : (
            <div className="py-12 text-center text-sm text-neutral-500 font-mono">
              No upcoming races on the calendar
            </div>
          )}
        </Panel>

        {schedule && (
          <Panel title={`Calendar · ${schedule.schedule.length} rounds`}>
            <CalendarStrip
              schedule={schedule.schedule}
              nowIso={schedule.now}
              nextRound={next?.round ?? null}
            />
          </Panel>
        )}

        <Panel title="Last Race">
          <LastRacePodium result={lastRace} />
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title="Drivers' Championship">
          <DriverStandingsMini rows={drivers} />
          <Link
            href="/team"
            className="block mt-3 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-[#DC0000] hover:text-white transition-colors"
          >
            Open Team Dashboard →
          </Link>
        </Panel>
        <Panel title="Constructors' Championship">
          <ConstructorStandingsMini rows={constructors} />
        </Panel>
        <Panel title="When a session goes live">
          <ul className="space-y-2 text-xs text-neutral-400 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-[#00ff9c]">●</span>
              <span>
                The home screen will switch automatically to the live timing
                tower the moment the next session begins.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-500">○</span>
              <span>
                Between sessions we deliberately hide live-style timing
                widgets to avoid showing stale or misleading data.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-500">○</span>
              <span>
                Telemetry and team views are still available as a replay of
                the most recent race.
              </span>
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className="animate-pulse space-y-4 py-4">
      <div className="h-3 w-32 rounded bg-white/10" />
      <div className="h-8 w-72 rounded bg-white/10" />
      <div className="h-16 w-56 rounded bg-white/5" />
      <div className="grid grid-cols-2 gap-2 max-w-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-white/5" />
        ))}
      </div>
    </div>
  );
}
