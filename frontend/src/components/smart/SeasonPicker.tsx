"use client";

import { useEffect, useState } from "react";
import { fetchAvailableSeasons } from "@/lib/api";
import { cn } from "@/lib/cn";

interface Props {
  selected: number | null;
  onChange: (year: number) => void;
  defaultYear?: number;
  limit?: number;
}

export function SeasonPicker({ selected, onChange, defaultYear, limit = 20 }: Props) {
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await fetchAvailableSeasons();
      if (cancelled) return;
      setYears(list);
      if (selected == null) {
        onChange(defaultYear ?? list[0] ?? new Date().getUTCFullYear());
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!years.length) {
    return (
      <div className="text-xs text-neutral-500 font-mono animate-pulse">
        Loading seasons…
      </div>
    );
  }
  const shown = years.slice(0, limit);
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Select season">
      {shown.map((y) => {
        const active = selected === y;
        return (
          <button
            key={y}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(y)}
            className={cn(
              "px-2.5 py-1.5 rounded text-xs font-mono uppercase tracking-[0.15em] border min-h-[32px] cursor-pointer transition-colors",
              active
                ? "border-[#DC0000]/70 bg-[#DC0000]/15 text-white shadow-[0_0_10px_rgba(220,0,0,0.25)]"
                : "border-white/5 bg-black/30 text-neutral-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            {y}
          </button>
        );
      })}
      {years.length > limit && (
        <span className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-600">
          +{years.length - limit} earlier
        </span>
      )}
    </div>
  );
}
