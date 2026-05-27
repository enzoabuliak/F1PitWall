"use client";

import { useTimingStore } from "@/stores/timingStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/cn";

export function DriverSelect() {
  const drivers = useTimingStore((s) => s.positions);
  const selected = useUIStore((s) => s.selectedDriver);
  const setSelected = useUIStore((s) => s.setSelectedDriver);

  if (!drivers.length) {
    return <div className="text-xs text-neutral-500 font-mono">No drivers loaded</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-1 max-h-[560px] overflow-y-auto pr-1">
      {drivers.map((d) => {
        const active = selected === d.driver_number;
        return (
          <button
            key={d.driver_number}
            onClick={() => setSelected(d.driver_number)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors border",
              active
                ? "bg-[#DC0000]/15 border-[#DC0000]/60 shadow-[0_0_10px_rgba(220,0,0,0.25)]"
                : "border-white/5 hover:bg-white/5 hover:border-white/10",
            )}
          >
            <span
              className="w-0.5 h-5 rounded-sm"
              style={{ backgroundColor: d.team_colour ? `#${d.team_colour}` : "#666" }}
            />
            <span className="text-[10px] font-mono text-neutral-500 w-5 text-right">
              {d.position ?? "-"}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 w-5">#{d.driver_number}</span>
            <span className="text-[11px] font-medium text-white truncate flex-1">
              {d.full_name?.split(" ").pop() ?? "?"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
