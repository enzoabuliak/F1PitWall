"use client";

import { useTimingStore } from "@/stores/timingStore";
import { cn } from "@/lib/cn";

interface Props {
  selected: [number | null, number | null];
  onChange: (next: [number | null, number | null]) => void;
}

export function DriverComparePicker({ selected, onChange }: Props) {
  const drivers = useTimingStore((s) => s.positions);
  const [a, b] = selected;

  if (!drivers.length) {
    return <div className="text-xs text-neutral-500 font-mono">Loading drivers…</div>;
  }

  function pick(driverNumber: number) {
    if (a === driverNumber) {
      onChange([null, b]);
      return;
    }
    if (b === driverNumber) {
      onChange([a, null]);
      return;
    }
    if (a == null) onChange([driverNumber, b]);
    else if (b == null) onChange([a, driverNumber]);
    else onChange([b, driverNumber]);
  }

  return (
    <div className="grid grid-cols-2 gap-1 max-h-[640px] overflow-y-auto pr-1">
      {drivers.map((d) => {
        const slot = a === d.driver_number ? "A" : b === d.driver_number ? "B" : null;
        return (
          <button
            key={d.driver_number}
            onClick={() => pick(d.driver_number)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors border cursor-pointer min-h-[36px]",
              slot
                ? "bg-[#DC0000]/15 border-[#DC0000]/60 shadow-[0_0_10px_rgba(220,0,0,0.25)]"
                : "border-white/5 hover:bg-white/5 hover:border-white/10",
            )}
            aria-label={
              slot
                ? `Driver ${d.full_name} selected as ${slot}`
                : `Compare driver ${d.full_name}`
            }
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
            {slot && (
              <span className="text-[9px] font-mono font-black text-[#DC0000] tracking-widest">
                {slot}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
