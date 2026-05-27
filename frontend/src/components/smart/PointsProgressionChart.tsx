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
import { teamColorOrLive } from "@/lib/teamColors";

interface Props {
  rounds: SeasonRoundResults[];
  teamColours?: Record<string, string | null>;
  topN?: number;
}

export function PointsProgressionChart({ rounds, teamColours = {}, topN = 6 }: Props) {
  const { data, teams, colours } = useMemo(() => {
    const cumulative: Record<string, number> = {};
    const data: Array<Record<string, number | string>> = [];
    for (const round of rounds) {
      for (const [team, pts] of Object.entries(round.constructor_points)) {
        cumulative[team] = (cumulative[team] ?? 0) + pts;
      }
      data.push({
        round: `R${round.round}`,
        ...cumulative,
      });
    }
    const totals = Object.entries(cumulative).sort((a, b) => b[1] - a[1]);
    const teams = totals.slice(0, topN).map(([name]) => name);
    const colours: Record<string, string> = {};
    teams.forEach((t, i) => {
      colours[t] = teamColorOrLive(t, teamColours[t], i);
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
    <div className="w-full h-[420px]" aria-label="Constructor points progression chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
          <XAxis
            dataKey="round"
            stroke="#666"
            tick={{ fill: "#aaa", fontSize: 10, fontFamily: "ui-monospace" }}
            interval={0}
            tickMargin={6}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: "#aaa", fontSize: 10, fontFamily: "ui-monospace" }}
            label={{
              value: "Points",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#888", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em" },
            }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.9)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              fontFamily: "ui-monospace",
              fontSize: 11,
            }}
            labelStyle={{ color: "#fff", marginBottom: 4 }}
            itemStyle={{ color: "#fff" }}
            cursor={{ stroke: "#444", strokeWidth: 1 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: "ui-monospace", color: "#ccc", paddingTop: 8 }}
            iconType="plainline"
          />
          {teams.map((team) => (
            <Line
              key={team}
              type="monotone"
              dataKey={team}
              stroke={colours[team]}
              strokeWidth={2}
              dot={{ r: 2.5, fill: colours[team] }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
