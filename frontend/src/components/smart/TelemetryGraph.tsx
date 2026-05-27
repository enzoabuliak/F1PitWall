"use client";

import { useTelemetryStore } from "@/stores/telemetryStore";
import { isSentinelTelemetry } from "@/lib/sentinel";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

interface Props {
  driverNumber: number;
  field: "throttle" | "brake" | "speed" | "rpm";
  color: string;
  label: string;
  unit?: string;
  domain?: [number, number];
}

const EMPTY: never[] = [];

export function TelemetryGraph({ driverNumber, field, color, label, unit, domain }: Props) {
  const buffer = useTelemetryStore((s) => s.buffers.get(driverNumber)) ?? EMPTY;
  const data = buffer.map((f, i) => ({
    i,
    v: isSentinelTelemetry(f) ? null : (f[field] ?? null),
  }));
  const latestFrame = buffer[buffer.length - 1];
  const latest = isSentinelTelemetry(latestFrame) ? null : latestFrame?.[field];

  return (
    <div className="rounded-lg border border-white/5 bg-black/40 p-3">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
          {label}
        </span>
        <span className="text-lg font-mono tabular-nums" style={{ color }}>
          {latest != null ? Math.round(Number(latest)) : "—"}
          {unit && <span className="text-[10px] text-neutral-500 ml-1">{unit}</span>}
        </span>
      </div>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`g-${field}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={domain ?? ["auto", "auto"]} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#g-${field})`}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GearDrsPanel({ driverNumber }: { driverNumber: number }) {
  const buffer = useTelemetryStore((s) => s.buffers.get(driverNumber)) ?? EMPTY;
  const latest = buffer[buffer.length - 1];
  const sentinel = isSentinelTelemetry(latest);
  const gear = sentinel ? null : latest?.n_gear ?? null;
  const drs = sentinel ? null : latest?.drs ?? null;
  const drsActive = drs != null && drs >= 10;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-white/5 bg-black/40 p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-1">
          Gear
        </span>
        <span className="text-5xl font-mono font-black text-[#00ff9c] leading-none">
          {gear ?? "—"}
        </span>
      </div>
      <div className="rounded-lg border border-white/5 bg-black/40 p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-1">
          DRS
        </span>
        <span
          className={
            "px-3 py-1 rounded font-mono font-black text-sm tracking-widest " +
            (drsActive
              ? "bg-[#00ff9c]/20 text-[#00ff9c] shadow-[0_0_12px_rgba(0,255,156,0.4)]"
              : "bg-neutral-800 text-neutral-500")
          }
        >
          {drsActive ? "OPEN" : "CLOSED"}
        </span>
      </div>
    </div>
  );
}
