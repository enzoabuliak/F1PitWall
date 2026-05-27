"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveData } from "@/hooks/useLiveData";
import {
  fetchAllSeasonResults,
  fetchConstructorStandings,
  fetchTeams,
} from "@/lib/api";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { Panel } from "@/components/atoms/Panel";
import { SeasonPicker } from "@/components/smart/SeasonPicker";
import { PointsProgressionChart } from "@/components/smart/PointsProgressionChart";
import { teamColorOrLive } from "@/lib/teamColors";
import type {
  ConstructorStanding,
  SeasonRoundResults,
  Team,
} from "@/lib/types";

interface ConstructorRow {
  position: number;
  team_name: string;
  points: number;
  wins: number;
  podiums: number;
  rounds_played: number;
  avg_per_race: number;
  best_round: number | null;
}

function buildConstructorRows(rounds: SeasonRoundResults[]): ConstructorRow[] {
  const acc: Record<string, ConstructorRow> = {};
  for (const round of rounds) {
    for (const [team, pts] of Object.entries(round.constructor_points)) {
      if (!acc[team]) {
        acc[team] = {
          position: 0,
          team_name: team,
          points: 0,
          wins: 0,
          podiums: 0,
          rounds_played: 0,
          avg_per_race: 0,
          best_round: null,
        };
      }
      acc[team].points += pts;
      acc[team].rounds_played += 1;
      if (acc[team].best_round == null || pts > (acc[team].best_round ?? 0)) {
        acc[team].best_round = pts;
      }
    }
    for (const [team, w] of Object.entries(round.constructor_wins ?? {})) {
      if (!acc[team]) {
        acc[team] = {
          position: 0,
          team_name: team,
          points: 0,
          wins: 0,
          podiums: 0,
          rounds_played: 0,
          avg_per_race: 0,
          best_round: null,
        };
      }
      acc[team].wins += w;
    }
    for (const [team, p] of Object.entries(round.constructor_podiums ?? {})) {
      if (!acc[team]) continue;
      acc[team].podiums += p;
    }
  }
  const rows = Object.values(acc).sort((a, b) => b.points - a.points);
  rows.forEach((r, i) => {
    r.position = i + 1;
    r.avg_per_race = r.rounds_played ? r.points / r.rounds_played : 0;
  });
  return rows;
}

export default function ConstructorsPage() {
  useLiveData();
  const [year, setYear] = useState<number | null>(null);
  const [rounds, setRounds] = useState<SeasonRoundResults[]>([]);
  const [standings, setStandings] = useState<ConstructorStanding[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTeams().then((d) => {
      if (!cancelled) setTeams(d.teams);
    });
    fetchConstructorStandings().then((d) => {
      if (!cancelled) setStandings(d.standings);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (year == null) return;
    let cancelled = false;
    setLoading(true);
    fetchAllSeasonResults(year)
      .then((d) => {
        if (!cancelled) setRounds(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const teamColours = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const t of teams) map[t.team_name] = t.team_colour;
    // include constructor-standing aliases (Ergast sometimes uses slightly different names)
    for (const s of standings) {
      if (!(s.team_name in map)) map[s.team_name] = null;
    }
    return map;
  }, [teams, standings]);

  const rows = useMemo(() => buildConstructorRows(rounds), [rounds]);
  const totalRounds = rounds.length;
  const totalPointsAwarded = rows.reduce((acc, r) => acc + r.points, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
        <div className="space-y-4">
          <Panel
            accent={!loading && rounds.length > 0}
            title={
              year
                ? `${year} · Constructors' Points Progression`
                : "Constructor Analytics"
            }
          >
            <div className="space-y-4">
              <SeasonPicker
                selected={year}
                onChange={setYear}
                defaultYear={new Date().getUTCFullYear()}
              />
              {loading && !rounds.length ? (
                <ChartSkeleton />
              ) : (
                <PointsProgressionChart rounds={rounds} teamColours={teamColours} topN={6} />
              )}
            </div>
          </Panel>

          <Panel title={year ? `${year} · Constructor Standings` : "Standings"}>
            {rows.length === 0 ? (
              <div className="text-xs text-neutral-500 font-mono">No data</div>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[28px_1fr_70px_60px_60px_80px] gap-2 px-3 pb-1 text-[9px] uppercase tracking-[0.18em] text-neutral-500 font-mono">
                  <span>P</span>
                  <span>Team</span>
                  <span className="text-right">Points</span>
                  <span className="text-right">Wins</span>
                  <span className="text-right">Best</span>
                  <span className="text-right">Avg / race</span>
                </div>
                <ol className="space-y-1" role="list">
                  {rows.map((r) => {
                    const colour = teamColorOrLive(r.team_name, teamColours[r.team_name]);
                    return (
                      <li
                        key={r.team_name}
                        className="grid grid-cols-[28px_1fr_70px_60px_60px_80px] gap-2 items-center px-3 py-2 rounded-md border border-white/5 bg-black/30"
                      >
                        <span className="font-mono text-sm font-bold text-white">
                          {r.position}
                        </span>
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-1 h-5 rounded-sm"
                            style={{ backgroundColor: colour }}
                          />
                          <span className="text-sm text-white truncate">{r.team_name}</span>
                        </span>
                        <span className="text-right text-xs font-mono text-[#00ff9c] tabular-nums">
                          {r.points.toFixed(0)}
                        </span>
                        <span className="text-right text-xs font-mono text-neutral-300 tabular-nums">
                          {r.wins}
                        </span>
                        <span className="text-right text-xs font-mono text-neutral-300 tabular-nums">
                          {r.best_round ?? "—"}
                        </span>
                        <span className="text-right text-xs font-mono text-neutral-400 tabular-nums">
                          {r.avg_per_race.toFixed(1)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Season summary">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Rounds run" value={String(totalRounds)} />
              <Stat label="Teams scored" value={String(rows.length)} />
              <Stat label="Total points" value={totalPointsAwarded.toFixed(0)} />
              <Stat
                label="Avg / round"
                value={
                  totalRounds && rows.length
                    ? (totalPointsAwarded / totalRounds).toFixed(1)
                    : "—"
                }
              />
            </dl>
          </Panel>

          <Panel title="Reading the chart">
            <ul className="text-xs text-neutral-400 space-y-2 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[#DC0000]">●</span>
                <span>
                  Each line is a constructor&apos;s cumulative points across
                  the season; top six teams shown.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-500">○</span>
                <span>
                  Colours come from OpenF1&apos;s live team_colour where
                  available; otherwise a default palette.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-500">○</span>
                <span>
                  Hover the lines for per-round point totals.
                </span>
              </li>
            </ul>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-black/40 border border-white/5 p-3">
      <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
        {label}
      </div>
      <div className="text-2xl font-mono font-black text-[#00ff9c] mt-1">{value}</div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[420px] w-full rounded-lg border border-white/10 bg-black/40 flex items-center justify-center animate-pulse">
      <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500">
        Loading season…
      </span>
    </div>
  );
}
