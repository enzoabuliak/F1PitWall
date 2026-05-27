"use client";

import { useEffect, useState } from "react";
import { countdownTo } from "@/lib/format";

interface Props {
  target: string | null;
  label?: string;
}

function pad(n: number, width = 2): string {
  return n.toString().padStart(width, "0");
}

export function Countdown({ target, label }: Props) {
  const [, force] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const c = countdownTo(target);

  if (!c) {
    return (
      <div className="font-mono text-neutral-500 text-sm">No upcoming session</div>
    );
  }

  if (c.total <= 0) {
    return (
      <div
        aria-label={label ? `${label} in progress` : "session in progress"}
        className="font-mono text-[#00ff9c] text-2xl tracking-widest"
      >
        ● LIVE NOW
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-label={
        label
          ? `${label} in ${c.days}d ${c.hours}h ${c.minutes}m`
          : `Countdown ${c.days}d ${c.hours}h`
      }
      className="flex items-end gap-3 font-mono"
    >
      <Unit value={c.days} unit="d" big />
      <Unit value={c.hours} unit="h" big />
      <Unit value={c.minutes} unit="m" />
      <Unit value={c.seconds} unit="s" />
    </div>
  );
}

function Unit({ value, unit, big }: { value: number; unit: string; big?: boolean }) {
  return (
    <div className="flex items-baseline">
      <span
        className={
          (big
            ? "text-5xl sm:text-6xl tabular-nums text-white"
            : "text-2xl sm:text-3xl tabular-nums text-neutral-300") +
          " font-black leading-none"
        }
        style={{ textShadow: big ? "0 0 22px rgba(220,0,0,0.25)" : undefined }}
      >
        {pad(value)}
      </span>
      <span className="ml-1 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-neutral-500">
        {unit}
      </span>
    </div>
  );
}
