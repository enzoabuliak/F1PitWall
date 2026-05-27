import { cn } from "@/lib/cn";

interface Props {
  value: number | null | undefined;
  format?: "lap" | "sector" | "gap" | "raw";
  className?: string;
  fallback?: string;
}

function formatLap(seconds: number) {
  if (!isFinite(seconds)) return "--:--.---";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}

export function TimingNumber({ value, format = "raw", className, fallback = "--" }: Props) {
  let display = fallback;
  if (typeof value === "number" && isFinite(value)) {
    if (format === "lap") display = formatLap(value);
    else if (format === "sector") display = value.toFixed(3);
    else if (format === "gap") display = value > 0 ? `+${value.toFixed(3)}` : value.toFixed(3);
    else display = value.toString();
  }
  return (
    <span
      className={cn(
        "font-mono tabular-nums tracking-wider text-[#00ff9c]",
        "drop-shadow-[0_0_4px_rgba(0,255,156,0.45)]",
        className,
      )}
    >
      {display}
    </span>
  );
}
