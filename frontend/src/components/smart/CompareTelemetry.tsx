"use client";

import { useTelemetryStore } from "@/stores/telemetryStore";
import { isSentinelTelemetry } from "@/lib/sentinel";
import type { TelemetryFrame } from "@/lib/types";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";

interface RowProps {
  field: keyof TelemetryFrame;
  label: string;
  unit?: string;
  domain?: [number, number] | undefined;
  driverA: number;
  driverB: number;
  colorA: string;
  colorB: string;
}

const EMPTY: TelemetryFrame[] = [];

export function CompareTelemetryRow({
  field,
  label,
  unit,
  domain,
  driverA,
  driverB,
  colorA,
  colorB,
}: RowProps) {
  const bufA = useTelemetryStore((s) => s.buffers.get(driverA)) ?? EMPTY;
  const bufB = useTelemetryStore((s) => s.buffers.get(driverB)) ?? EMPTY;

  const len = Math.max(bufA.length, bufB.length);
  const data: Array<{ i: number; a: number | null; b: number | null }> = [];
  for (let i = 0; i < len; i++) {
    const fa = bufA[bufA.length - len + i];
    const fb = bufB[bufB.length - len + i];
    const aVal = !fa || isSentinelTelemetry(fa) ? null : Number(fa[field] ?? null);
    const bVal = !fb || isSentinelTelemetry(fb) ? null : Number(fb[field] ?? null);
    data.push({
      i,
      a: Number.isFinite(aVal as number) ? (aVal as number) : null,
      b: Number.isFinite(bVal as number) ? (bVal as number) : null,
    });
  }
  const fA = bufA[bufA.length - 1];
  const fB = bufB[bufB.length - 1];
  const latestA = isSentinelTelemetry(fA) ? null : fA?.[field];
  const latestB = isSentinelTelemetry(fB) ? null : fB?.[field];

  return (
    <div className="rounded-lg border border-white/5 bg-black/40 p-3">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
          {label}
        </span>
        <span className="flex gap-3 text-sm font-mono tabular-nums">
          <span style={{ color: colorA }}>
            {latestA != null ? Math.round(Number(latestA)) : "—"}
            {unit && <span className="text-[10px] text-neutral-500 ml-0.5">{unit}</span>}
          </span>
          <span className="text-neutral-700">/</span>
          <span style={{ color: colorB }}>
            {latestB != null ? Math.round(Number(latestB)) : "—"}
            {unit && <span className="text-[10px] text-neutral-500 ml-0.5">{unit}</span>}
          </span>
        </span>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <YAxis hide domain={domain ?? ["auto", "auto"]} />
            <Line
              type="monotone"
              dataKey="a"
              stroke={colorA}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="b"
              stroke={colorB}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface DeltaProps {
  driverA: number;
  driverB: number;
  colorA: string;
  colorB: string;
}

export function ThrottleDelta({ driverA, driverB, colorA, colorB }: DeltaProps) {
  const bufA = useTelemetryStore((s) => s.buffers.get(driverA)) ?? EMPTY;
  const bufB = useTelemetryStore((s) => s.buffers.get(driverB)) ?? EMPTY;
  const len = Math.max(bufA.length, bufB.length);
  const data: Array<{ i: number; delta: number }> = [];
  for (let i = 0; i < len; i++) {
    const fa = bufA[bufA.length - len + i];
    const fb = bufB[bufB.length - len + i];
    const ta = fa?.throttle ?? null;
    const tb = fb?.throttle ?? null;
    if (ta == null || tb == null) continue;
    data.push({ i, delta: Number(ta) - Number(tb) });
  }
  if (!data.length) return null;
  const last = data[data.length - 1]?.delta ?? 0;
  return (
    <div className="rounded-lg border border-white/5 bg-black/40 p-3">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
          Throttle Δ (A − B)
        </span>
        <span
          className="text-sm font-mono tabular-nums"
          style={{ color: last >= 0 ? colorA : colorB }}
        >
          {last > 0 ? "+" : ""}
          {last.toFixed(0)}%
        </span>
      </div>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="delta-pos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorA} stopOpacity={0.5} />
                <stop offset="100%" stopColor={colorA} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[-100, 100]} />
            <Area
              type="monotone"
              dataKey="delta"
              stroke={colorA}
              strokeWidth={1}
              fill="url(#delta-pos)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
