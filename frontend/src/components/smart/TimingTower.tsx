"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useTimingStore } from "@/stores/timingStore";
import { useUIStore } from "@/stores/uiStore";
import { useDrs } from "@/hooks/useDrs";
import { TimingNumber } from "@/components/atoms/TimingNumber";
import { TireCompound } from "@/components/atoms/TireCompound";
import { cn } from "@/lib/cn";
import type { DriverPosition, DrsResponse } from "@/lib/types";

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

const COLS = "28px_44px_1fr_70px_36px_42px_60px_60px_60px_70px";

export function TimingTower() {
  const positions = useTimingStore((s) => s.positions);
  const selected = useUIStore((s) => s.selectedDriver);
  const setSelected = useUIStore((s) => s.setSelectedDriver);
  const drs = useDrs(3000);

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
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="min-w-[700px] space-y-1">
        <div className={cn("grid gap-2 px-3 pb-1 text-[9px] uppercase tracking-[0.18em] text-neutral-500 font-mono", "grid-cols-[28px_44px_1fr_70px_36px_42px_60px_60px_60px_70px]")}>
          <span>P</span>
          <span>#</span>
          <span>Driver</span>
          <span className="text-right">Gap</span>
          <span className="text-right">Pit</span>
          <span className="text-right">DRS</span>
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
              drs={drs[d.driver_number] ?? drs[String(d.driver_number)]}
              selected={selected === d.driver_number}
              onSelect={() => setSelected(selected === d.driver_number ? null : d.driver_number)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TimingRow({
  driver,
  bests,
  drs,
  selected,
  onSelect,
}: {
  driver: DriverPosition;
  bests: { s1: number | null; s2: number | null; s3: number | null; lap: number | null };
  drs: DrsResponse["drs"][string] | undefined;
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
        "w-full grid gap-2 items-center px-3 py-2 rounded-md border text-left transition-colors",
        "grid-cols-[28px_44px_1fr_70px_36px_42px_60px_60px_60px_70px]",
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
      <span className="text-right">
        <span
          className={cn(
            "inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-widest border",
            drs?.open
              ? "bg-[#00ff9c]/20 text-[#00ff9c] border-[#00ff9c]/40 shadow-[0_0_8px_rgba(0,255,156,0.35)]"
              : "bg-neutral-900 text-neutral-600 border-white/5",
          )}
        >
          DRS
        </span>
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
