"use client";

import { useState } from "react";
import { useLiveData } from "@/hooks/useLiveData";
import { useTelemetryPolling } from "@/hooks/useTelemetryPolling";
import { useTimingStore } from "@/stores/timingStore";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { ReplayBanner } from "@/components/atoms/ReplayBanner";
import { Panel } from "@/components/atoms/Panel";
import { DriverComparePicker } from "@/components/smart/DriverComparePicker";
import {
  CompareTelemetryRow,
  ThrottleDelta,
} from "@/components/smart/CompareTelemetry";
import { formatLapTime } from "@/lib/format";

function formatGap(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const sign = seconds > 0 ? "+" : "";
  return `${sign}${seconds.toFixed(3)}s`;
}

export default function ComparePage() {
  useLiveData();
  const [selected, setSelected] = useState<[number | null, number | null]>([null, null]);
  const [a, b] = selected;
  useTelemetryPolling(a, 1500);
  useTelemetryPolling(b, 1500);

  const drivers = useTimingStore((s) => s.positions);
  const dA = drivers.find((d) => d.driver_number === a) ?? null;
  const dB = drivers.find((d) => d.driver_number === b) ?? null;
  const colorA = dA?.team_colour ? `#${dA.team_colour}` : "#DC0000";
  const colorB = dB?.team_colour ? `#${dB.team_colour}` : "#3FA9F5";

  const lapDelta =
    dA?.last_lap_time != null && dB?.last_lap_time != null
      ? dA.last_lap_time - dB.last_lap_time
      : null;
  const s1Delta =
    dA?.sector1_time != null && dB?.sector1_time != null
      ? dA.sector1_time - dB.sector1_time
      : null;
  const s2Delta =
    dA?.sector2_time != null && dB?.sector2_time != null
      ? dA.sector2_time - dB.sector2_time
      : null;
  const s3Delta =
    dA?.sector3_time != null && dB?.sector3_time != null
      ? dA.sector3_time - dB.sector3_time
      : null;

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <ReplayBanner />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 p-4">
        <Panel title="Pick two drivers">
          <DriverComparePicker selected={selected} onChange={setSelected} />
          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Slots {a ? "A" : "—"} / {b ? "B" : "—"} filled
          </p>
        </Panel>

        <div className="space-y-4">
          <Panel
            accent={!!(a && b)}
            title={
              a && b && dA && dB
                ? `${dA.full_name?.split(" ").pop()} vs ${dB.full_name?.split(" ").pop()}`
                : "Comparison"
            }
          >
            {!a || !b ? (
              <div className="py-12 text-center text-sm text-neutral-500 font-mono">
                Select two drivers from the panel on the left
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <DriverHeader driver={dA} colour={colorA} slot="A" />
                  <DriverHeader driver={dB} colour={colorB} slot="B" />
                </div>

                <div className="grid grid-cols-4 gap-px bg-white/5 rounded overflow-hidden">
                  <DeltaCell label="Δ Last lap" value={formatGap(lapDelta)} />
                  <DeltaCell label="Δ S1" value={formatGap(s1Delta)} />
                  <DeltaCell label="Δ S2" value={formatGap(s2Delta)} />
                  <DeltaCell label="Δ S3" value={formatGap(s3Delta)} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <CompareTelemetryRow
                    field="throttle"
                    label="Throttle"
                    unit="%"
                    domain={[0, 100]}
                    driverA={a}
                    driverB={b}
                    colorA={colorA}
                    colorB={colorB}
                  />
                  <CompareTelemetryRow
                    field="brake"
                    label="Brake"
                    unit="%"
                    domain={[0, 100]}
                    driverA={a}
                    driverB={b}
                    colorA={colorA}
                    colorB={colorB}
                  />
                  <CompareTelemetryRow
                    field="speed"
                    label="Speed"
                    unit="km/h"
                    driverA={a}
                    driverB={b}
                    colorA={colorA}
                    colorB={colorB}
                  />
                  <CompareTelemetryRow
                    field="rpm"
                    label="RPM"
                    driverA={a}
                    driverB={b}
                    colorA={colorA}
                    colorB={colorB}
                  />
                </div>

                <ThrottleDelta
                  driverA={a}
                  driverB={b}
                  colorA={colorA}
                  colorB={colorB}
                />

                <div className="grid grid-cols-2 gap-3">
                  <LapsSummary driver={dA} colour={colorA} />
                  <LapsSummary driver={dB} colour={colorB} />
                </div>
              </div>
            )}
          </Panel>
        </div>
      </main>
    </div>
  );
}

function DriverHeader({
  driver,
  colour,
  slot,
}: {
  driver: ReturnType<typeof useTimingStore.getState>["positions"][number] | null;
  colour: string;
  slot: "A" | "B";
}) {
  if (!driver) {
    return (
      <div className="rounded-lg border border-white/5 bg-black/40 p-3 text-xs text-neutral-500 font-mono">
        Slot {slot} empty
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-3 flex items-center gap-3">
      <span className="w-1 h-10 rounded-sm" style={{ backgroundColor: colour }} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
          Slot {slot} · #{driver.driver_number}
        </div>
        <div className="text-sm font-bold text-white truncate">
          {driver.full_name}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          {driver.team_name ?? "—"}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          Pos
        </div>
        <div className="text-2xl font-mono font-black text-[#00ff9c] leading-none">
          {driver.position ?? "—"}
        </div>
      </div>
    </div>
  );
}

function DeltaCell({ label, value }: { label: string; value: string }) {
  const positive = value.startsWith("+");
  const negative = value.startsWith("-");
  return (
    <div className="bg-black/40 p-2 text-center">
      <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </div>
      <div
        className={
          "text-sm font-mono " +
          (positive ? "text-[#DC0000]" : negative ? "text-[#00ff9c]" : "text-white")
        }
      >
        {value}
      </div>
    </div>
  );
}

function LapsSummary({
  driver,
  colour,
}: {
  driver: ReturnType<typeof useTimingStore.getState>["positions"][number] | null;
  colour: string;
}) {
  if (!driver) return null;
  return (
    <div className="rounded-lg border border-white/5 bg-black/40 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-0.5 h-5 rounded-sm" style={{ backgroundColor: colour }} />
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
          {driver.full_name?.split(" ").pop()}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-y-1 text-xs font-mono">
        <dt className="text-neutral-500">Last lap</dt>
        <dd className="text-[#00ff9c] text-right">{formatLapTime(driver.last_lap_time)}</dd>
        <dt className="text-neutral-500">Sector 1</dt>
        <dd className="text-white text-right">{formatLapTime(driver.sector1_time)}</dd>
        <dt className="text-neutral-500">Sector 2</dt>
        <dd className="text-white text-right">{formatLapTime(driver.sector2_time)}</dd>
        <dt className="text-neutral-500">Sector 3</dt>
        <dd className="text-white text-right">{formatLapTime(driver.sector3_time)}</dd>
        <dt className="text-neutral-500">Tire</dt>
        <dd className="text-white text-right">{driver.tire_compound ?? "—"}</dd>
      </dl>
    </div>
  );
}
