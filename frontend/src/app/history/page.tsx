"use client";

import { useEffect, useState } from "react";
import { useLiveData } from "@/hooks/useLiveData";
import { fetchSeasonWinners } from "@/lib/api";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { Panel } from "@/components/atoms/Panel";
import { SeasonPicker } from "@/components/smart/SeasonPicker";
import { formatDate } from "@/lib/format";
import type { SeasonWinner } from "@/lib/types";

export default function HistoryPage() {
  useLiveData();
  const [year, setYear] = useState<number | null>(null);
  const [winners, setWinners] = useState<SeasonWinner[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (year == null) return;
    let cancelled = false;
    setLoading(true);
    fetchSeasonWinners(year)
      .then((rows) => {
        if (!cancelled) setWinners(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  // Build constructor leaderboard for the selected season
  const constructorWins: Record<string, number> = {};
  for (const w of winners) {
    if (w.winner_constructor) {
      constructorWins[w.winner_constructor] =
        (constructorWins[w.winner_constructor] ?? 0) + 1;
    }
  }
  const driverWins: Record<string, { code: string | null; name: string; wins: number }> = {};
  for (const w of winners) {
    if (!w.winner_full_name) continue;
    const key = w.winner_full_name;
    if (!driverWins[key]) {
      driverWins[key] = { code: w.winner_code, name: w.winner_full_name, wins: 0 };
    }
    driverWins[key].wins += 1;
  }
  const topDrivers = Object.values(driverWins).sort((a, b) => b.wins - a.wins).slice(0, 5);
  const topConstructors = Object.entries(constructorWins)
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
        <Panel
          accent={!loading && winners.length > 0}
          title={year ? `${year} Season · Race Winners` : "Historical Race Data"}
        >
          <div className="space-y-4">
            <SeasonPicker selected={year} onChange={setYear} defaultYear={new Date().getUTCFullYear()} />
            {loading ? (
              <SkeletonGrid />
            ) : winners.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-500 font-mono">
                No results recorded for this season yet
              </div>
            ) : (
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-2" role="list">
                {winners.map((w) => (
                  <li
                    key={w.round}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-white/5 bg-black/30 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono w-8">
                      R{w.round}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {w.race_name ?? "—"}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 truncate">
                        {w.country ?? "—"} · {formatDate(w.date)}
                      </div>
                    </div>
                    <div className="text-right min-w-0">
                      <div className="text-xs font-mono text-[#00ff9c] truncate">
                        {w.winner_code ? `${w.winner_code} · ` : ""}
                        {w.winner_full_name?.split(" ").slice(-1)[0] ?? "—"}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 truncate">
                        {w.winner_constructor ?? "—"}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title={year ? `${year} Top Winners · Drivers` : "Top Winners"}>
            {topDrivers.length === 0 ? (
              <div className="text-xs text-neutral-500 font-mono">No data</div>
            ) : (
              <ol className="space-y-1">
                {topDrivers.map((d, i) => (
                  <li
                    key={d.name}
                    className="flex items-center justify-between text-xs font-mono px-2 py-1.5 rounded"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-neutral-500 w-5 text-right">P{i + 1}</span>
                      <span className="text-white truncate">
                        {d.code ? `${d.code} · ` : ""}
                        {d.name}
                      </span>
                    </span>
                    <span className="text-[#00ff9c] tabular-nums">{d.wins}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title={year ? `${year} Top Winners · Teams` : "Top Winners · Teams"}>
            {topConstructors.length === 0 ? (
              <div className="text-xs text-neutral-500 font-mono">No data</div>
            ) : (
              <ol className="space-y-1">
                {topConstructors.map((c, i) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between text-xs font-mono px-2 py-1.5 rounded"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-neutral-500 w-5 text-right">P{i + 1}</span>
                      <span className="text-white truncate">{c.name}</span>
                    </span>
                    <span className="text-[#00ff9c] tabular-nums">{c.wins}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="About">
            <p className="text-xs text-neutral-400 leading-relaxed">
              Race winners pulled live from the Ergast historical archive
              (via the Jolpica mirror). Pick a season to see every Grand
              Prix and who won it. Most seasons back to 1950 are available.
            </p>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded bg-white/5" />
      ))}
    </div>
  );
}
