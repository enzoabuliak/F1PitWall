"use client";

import { useEffect, useState } from "react";
import { useLiveData } from "@/hooks/useLiveData";
import { fetchLastQualifying } from "@/lib/api";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { Panel } from "@/components/atoms/Panel";
import { formatDate } from "@/lib/format";
import type { QualifyingResult, QualifyingSession } from "@/lib/types";
import { cn } from "@/lib/cn";

function fmtSec(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(3);
  return m > 0 ? `${m}:${s.padStart(6, "0")}` : s;
}

function fastestIn(rows: QualifyingResult[], key: "q1_seconds" | "q2_seconds" | "q3_seconds"): number | null {
  let best: number | null = null;
  for (const r of rows) {
    const v = r[key];
    if (v == null) continue;
    if (best == null || v < best) best = v;
  }
  return best;
}

export default function QualifyingPage() {
  useLiveData();
  const [data, setData] = useState<QualifyingSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const q = await fetchLastQualifying();
        if (!cancelled) setData(q);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
  }, []);

  const bestQ1 = data ? fastestIn(data.results, "q1_seconds") : null;
  const bestQ2 = data ? fastestIn(data.results, "q2_seconds") : null;
  const bestQ3 = data ? fastestIn(data.results, "q3_seconds") : null;
  const poleTime = data?.results[0]?.q3_seconds ?? data?.results[0]?.q2_seconds ?? data?.results[0]?.q1_seconds ?? null;

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
        <Panel
          accent={!!data}
          title={
            data
              ? `Qualifying · ${data.race_name}${data.country ? ` · ${data.country}` : ""}`
              : "Qualifying"
          }
        >
          {loading ? (
            <SkeletonGrid />
          ) : !data ? (
            <div className="py-12 text-center text-sm text-neutral-500 font-mono">
              No qualifying results available
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[28px_40px_1fr_120px_90px_90px_90px_90px] gap-2 px-3 pb-2 text-[9px] uppercase tracking-[0.18em] text-neutral-500 font-mono">
                <span>P</span>
                <span>#</span>
                <span>Driver</span>
                <span>Team</span>
                <span className="text-right">Q1</span>
                <span className="text-right">Q2</span>
                <span className="text-right">Q3</span>
                <span className="text-right">Gap to Pole</span>
              </div>
              <ol className="space-y-1">
                {data.results.map((r) => {
                  const ko =
                    r.position >= 16
                      ? "Q1"
                      : r.position >= 11
                        ? "Q2"
                        : null;
                  const bestForRow = r.q3_seconds ?? r.q2_seconds ?? r.q1_seconds;
                  const gap =
                    poleTime != null && bestForRow != null
                      ? bestForRow - poleTime
                      : null;
                  return (
                    <li
                      key={r.position}
                      className={cn(
                        "grid grid-cols-[28px_40px_1fr_120px_90px_90px_90px_90px] gap-2 items-center px-3 py-2 rounded-md border bg-black/30",
                        r.position === 1
                          ? "border-[#DC0000]/60 shadow-[0_0_12px_rgba(220,0,0,0.25)]"
                          : ko
                            ? "border-white/[0.04] opacity-70"
                            : "border-white/5",
                      )}
                    >
                      <span className="font-mono text-sm font-bold text-white">{r.position}</span>
                      <span className="font-mono text-xs text-neutral-400">
                        {r.driver_number ?? "—"}
                      </span>
                      <span className="text-sm font-medium text-white truncate">
                        {r.driver_code ? `${r.driver_code} · ` : ""}
                        {r.full_name}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 truncate">
                        {r.team_name ?? "—"}
                      </span>
                      <QTime
                        seconds={r.q1_seconds}
                        best={bestQ1}
                        eliminated={ko === "Q1"}
                      />
                      <QTime
                        seconds={r.q2_seconds}
                        best={bestQ2}
                        eliminated={ko === "Q2"}
                      />
                      <QTime
                        seconds={r.q3_seconds}
                        best={bestQ3}
                        eliminated={false}
                      />
                      <span
                        className={cn(
                          "text-right text-xs font-mono tabular-nums",
                          gap === 0
                            ? "text-[#B36BFF]"
                            : "text-neutral-400",
                        )}
                      >
                        {gap == null
                          ? "—"
                          : gap === 0
                            ? "POLE"
                            : `+${gap.toFixed(3)}`}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Pole Position">
            {data?.results[0] ? (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#DC0000] font-bold">
                  P1 · {data.race_name}
                </div>
                <div className="text-xl font-bold text-white">
                  {data.results[0].full_name}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  {data.results[0].team_name}
                </div>
                <div className="pt-3 border-t border-white/5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                    Pole lap
                  </div>
                  <div className="text-3xl font-mono font-black text-[#00ff9c] tabular-nums">
                    {fmtSec(poleTime)}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 mt-1">
                    {formatDate(data.date)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-500 font-mono">No data</div>
            )}
          </Panel>

          <Panel title="Knockout phases">
            <ul className="text-xs text-neutral-400 space-y-2 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-neutral-500">Q1</span>
                <span>All 20 drivers · bottom 5 (P16–P20) eliminated</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-500">Q2</span>
                <span>15 drivers · bottom 5 (P11–P15) eliminated</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-500">Q3</span>
                <span>Top 10 shootout for pole position</span>
              </li>
              <li className="flex gap-2 pt-2 border-t border-white/5">
                <span className="text-[#B36BFF]">●</span>
                <span>Purple times are session-best in that segment.</span>
              </li>
            </ul>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function QTime({
  seconds,
  best,
  eliminated,
}: {
  seconds: number | null;
  best: number | null;
  eliminated: boolean;
}) {
  const isBest =
    seconds != null && best != null && Math.abs(seconds - best) < 0.001;
  return (
    <span
      className={cn(
        "text-right text-xs font-mono tabular-nums",
        isBest
          ? "text-[#B36BFF]"
          : eliminated
            ? "text-neutral-500"
            : "text-white",
      )}
    >
      {fmtSec(seconds)}
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-1 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-9 rounded bg-white/5" />
      ))}
    </div>
  );
}
