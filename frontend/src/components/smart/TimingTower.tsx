"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTimingStore } from "@/stores/timingStore";
import { useUIStore } from "@/stores/uiStore";
import { TimingNumber } from "@/components/atoms/TimingNumber";
import { TireCompound } from "@/components/atoms/TireCompound";
import { cn } from "@/lib/cn";

export function TimingTower() {
  const positions = useTimingStore((s) => s.positions);
  const selected = useUIStore((s) => s.selectedDriver);
  const setSelected = useUIStore((s) => s.setSelectedDriver);

  if (positions.length === 0) {
    return (
      <div className="text-center text-sm text-neutral-500 py-12 font-mono">
        Awaiting timing data…
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[28px_44px_1fr_70px_70px_70px_70px_70px] gap-2 px-3 pb-1 text-[9px] uppercase tracking-[0.18em] text-neutral-500 font-mono">
        <span>P</span>
        <span>#</span>
        <span>Driver</span>
        <span className="text-right">Gap</span>
        <span className="text-right">S1</span>
        <span className="text-right">S2</span>
        <span className="text-right">S3</span>
        <span className="text-right">Last Lap</span>
      </div>
      <AnimatePresence initial={false}>
        {positions.map((d) => {
          const teamColor = d.team_colour ? `#${d.team_colour}` : "#666";
          const isSelected = selected === d.driver_number;
          return (
            <motion.button
              key={d.driver_number}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => setSelected(isSelected ? null : d.driver_number)}
              className={cn(
                "w-full grid grid-cols-[28px_44px_1fr_70px_70px_70px_70px_70px] gap-2 items-center px-3 py-2 rounded-md border text-left transition-all",
                isSelected
                  ? "border-[#DC0000]/60 bg-[#DC0000]/10"
                  : "border-white/5 bg-black/30 hover:bg-white/[0.04]",
              )}
            >
              <span className="font-mono text-sm font-bold text-white">{d.position ?? "-"}</span>
              <span className="font-mono text-xs text-neutral-400">{d.driver_number}</span>
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-5 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: teamColor, boxShadow: `0 0 6px ${teamColor}` }}
                />
                <span className="truncate text-sm font-medium text-white">
                  {d.full_name ?? `Driver ${d.driver_number}`}
                </span>
                <TireCompound compound={d.tire_compound ?? null} age={d.tire_age} />
              </span>
              <span className="text-right">
                <TimingNumber value={d.gap_to_leader} format="gap" className="text-xs" />
              </span>
              <span className="text-right">
                <TimingNumber value={d.sector1_time} format="sector" className="text-xs" />
              </span>
              <span className="text-right">
                <TimingNumber value={d.sector2_time} format="sector" className="text-xs" />
              </span>
              <span className="text-right">
                <TimingNumber value={d.sector3_time} format="sector" className="text-xs" />
              </span>
              <span className="text-right">
                <TimingNumber value={d.last_lap_time} format="lap" className="text-xs" />
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
