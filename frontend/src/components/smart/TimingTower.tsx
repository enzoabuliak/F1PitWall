"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useTimingStore } from "@/stores/timingStore";
import { useUIStore } from "@/stores/uiStore";
import { TimingNumber } from "@/components/atoms/TimingNumber";
import { TireCompound } from "@/components/atoms/TireCompound";
import { cn } from "@/lib/cn";
import type { DriverPosition } from "@/lib/types";

function bestOf(values: Array<number | null | undefined>): number | null {
  let best: number | null = null;
  for (const v of values) {
    if (v == null || v <= 0) continue;
    if (best === null || v < best) best = v;
  }
  return best;
}

function sectorClass(value: number | null, sessionBest: number | null) {
  if (value == null) return "";
  if (sessionBest != null && Math.abs(value - sessionBest) < 0.001)
    return "text-[#B36BFF]"; // session-best purple
  return "";
}

export function TimingTower() {
  const positions = useTimingStore((s) => s.positions);
  const selected = useUIStore((s) => s.selectedDriver);
  const setSelected = useUIStore((s) => s.setSelectedDriver);

  const bests = useMemo(() => {
    return {
      s1: bestOf(positions.map((p) => p.sector1_time)),
      s2: bestOf(positions.map((p) => p.sector2_time)),
      s3: bestOf(positions.map((p) => p.sector3_time)),
      lap: bestOf(positions.map((p) => p.last_lap_time)),
    };
  }, [positions]);

  if (positions.length === 0) {
    return (
      <div className="text-center text-sm text-neutral-500 py-12 font-mono">
        Awaiting timing data…
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[28px_44px_1fr_70px_36px_60px_60px_60px_70px] gap-2 px-3 pb-1 text-[9px] uppercase tracking-[0.18em] text-neutral-500 font-mono">
        <span>P</span>
        <span>#</span>
        <span>Driver</span>
        <span className="text-right">Gap</span>
        <span className="text-right">Pit</span>
        <span className="text-right">S1</span>
        <span className="text-right">S2</span>
        <span className="text-right">S3</span>
        <span className="text-right">Last Lap</span>
      </div>
      <AnimatePresence initial={false}>
        {positions.map((d) => (
          <TimingRow
            key={d.driver_number}
            driver={d}
            bests={bests}
            selected={selected === d.driver_number}
            onSelect={() => setSelected(selected === d.driver_number ? null : d.driver_number)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function TimingRow({
  driver,
  bests,
  selected,
  onSelect,
}: {
  driver: DriverPosition;
  bests: { s1: number | null; s2: number | null; s3: number | null; lap: number | null };
  selected: boolean;
  onSelect: () => void;
}) {
  const teamColor = driver.team_colour ? `#${driver.team_colour}` : "#666";
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      onClick={onSelect}
      className={cn(
        "w-full grid grid-cols-[28px_44px_1fr_70px_36px_60px_60px_60px_70px] gap-2 items-center px-3 py-2 rounded-md border text-left transition-colors",
        selected
          ? "border-[#DC0000]/60 bg-[#DC0000]/10"
          : "border-white/5 bg-black/30 hover:bg-white/[0.04]",
      )}
    >
      <span className="font-mono text-sm font-bold text-white">{driver.position ?? "-"}</span>
      <span className="font-mono text-xs text-neutral-400">{driver.driver_number}</span>
      <span className="flex items-center gap-2 min-w-0">
        <span
          className="h-5 w-1 rounded-full shrink-0"
          style={{ backgroundColor: teamColor, boxShadow: `0 0 6px ${teamColor}` }}
        />
        <span className="truncate text-sm font-medium text-white">
          {driver.full_name ?? `Driver ${driver.driver_number}`}
        </span>
        <TireCompound compound={driver.tire_compound ?? null} age={driver.tire_age} />
      </span>
      <span className="text-right">
        <TimingNumber value={driver.gap_to_leader} format="gap" className="text-xs" />
      </span>
      <span className="text-right font-mono text-xs text-neutral-400 tabular-nums">
        {driver.pit_stops != null ? driver.pit_stops : "—"}
      </span>
      <span className={cn("text-right", sectorClass(driver.sector1_time, bests.s1))}>
        <TimingNumber value={driver.sector1_time} format="sector" className="text-xs" />
      </span>
      <span className={cn("text-right", sectorClass(driver.sector2_time, bests.s2))}>
        <TimingNumber value={driver.sector2_time} format="sector" className="text-xs" />
      </span>
      <span className={cn("text-right", sectorClass(driver.sector3_time, bests.s3))}>
        <TimingNumber value={driver.sector3_time} format="sector" className="text-xs" />
      </span>
      <span className={cn("text-right", sectorClass(driver.last_lap_time, bests.lap))}>
        <TimingNumber value={driver.last_lap_time} format="lap" className="text-xs" />
      </span>
    </motion.button>
  );
}
