"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeasonRoundResults } from "@/lib/types";

interface Props {
  rounds: SeasonRoundResults[];
  teamColours?: Record<string, string | null>;
  topN?: number;
}

const FALLBACK_PALETTE = [
  "#DC0000",
  "#00D7B6",
  "#F47600",
  "#4781D7",
  "#FFD15C",
  "#3FB364",
  "#B36BFF",
  "#FF4747",
];

export function PointsProgressionChart({ rounds, teamColours = {}, topN = 6 }: Props) {
  const { data, teams, colours } = useMemo(() => {
    const cumulative: Record<string, number> = {};
    const data: Array<Record<string, number | string>> = [];
    const allTeams = new Set<string>();
    for (const round of rounds) {
      for (const [team, pts] of Object.entries(round.constructor_points)) {
        cumulative[team] = (cumulative[team] ?? 0) + pts;
        allTeams.add(team);
      }
      data.push({
        round: `R${round.round}`,
        ...cumulative,
      });
    }
    // pick top N by final cumulative
    const totals = Object.entries(cumulative).sort((a, b) => b[1] - a[1]);
    const teams = totals.slice(0, topN).map(([name]) => name);
    const colours: Record<string, string> = {};
    teams.forEach((t, i) => {
      const c = teamColours[t];
      colours[t] = c ? `#${c.replace("#", "")}` : FALLBACK_PALETTE[i % FALLBACK_PALETTE.length];
    });
    return { data, teams, colours };
  }, [rounds, teamColours, topN]);

  if (!rounds.length) {
    return (
      <div className="aspect-video w-full rounded-lg border border-white/10 bg-black/40 flex items-center justify-center">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500">
          No data
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
          <XAxis
            dataKey="round"
            stroke="#666"
            tick={{ fill: "#888", fontSize: 10, fontFamily: "ui-monospace" }}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: "#888", fontSize: 10, fontFamily: "ui-monospace" }}
            label={{
              value: "Points",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em" },
            }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              fontFamily: "ui-monospace",
              fontSize: 11,
            }}
            labelStyle={{ color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: "ui-monospace", color: "#aaa" }}
          />
          {teams.map((team) => (
            <Line
              key={team}
              type="monotone"
              dataKey={team}
              stroke={colours[team]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
