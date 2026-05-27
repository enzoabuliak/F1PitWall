"use client";

import { cn } from "@/lib/cn";
import type { Team } from "@/lib/types";

interface Props {
  teams: Team[];
  selected: string | null;
  onSelect: (team: string) => void;
}

export function TeamPicker({ teams, selected, onSelect }: Props) {
  if (!teams.length) {
    return <div className="text-xs text-neutral-500 font-mono">No teams loaded</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-1">
      {teams.map((t) => {
        const active = selected === t.team_name;
        const colour = t.team_colour ? `#${t.team_colour}` : "#666";
        return (
          <button
            key={t.team_name}
            onClick={() => onSelect(t.team_name)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded text-left border transition-colors",
              active
                ? "border-[#DC0000]/60 bg-[#DC0000]/10 shadow-[0_0_10px_rgba(220,0,0,0.25)]"
                : "border-white/5 hover:bg-white/5 hover:border-white/10",
            )}
          >
            <span className="w-1 h-8 rounded-sm" style={{ backgroundColor: colour }} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-white truncate">{t.team_name}</div>
              <div className="text-[10px] font-mono text-neutral-500">
                {t.drivers.map((d) => d.name_acronym ?? "?").join("  ·  ")}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
