import { cn } from "@/lib/cn";

const COLORS: Record<string, string> = {
  SOFT: "border-red-500 text-red-400 bg-red-500/10",
  MEDIUM: "border-yellow-400 text-yellow-300 bg-yellow-400/10",
  HARD: "border-white text-white bg-white/10",
  INTERMEDIATE: "border-green-500 text-green-400 bg-green-500/10",
  WET: "border-blue-500 text-blue-400 bg-blue-500/10",
};

const LETTER: Record<string, string> = {
  SOFT: "S",
  MEDIUM: "M",
  HARD: "H",
  INTERMEDIATE: "I",
  WET: "W",
};

export function TireCompound({ compound, age, className }: { compound: string | null; age?: number | null; className?: string }) {
  if (!compound) {
    return <span className={cn("text-neutral-600 text-xs font-mono", className)}>—</span>;
  }
  const c = COLORS[compound] ?? "border-neutral-500 text-neutral-300 bg-neutral-500/10";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-mono", className)}>
      <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full border font-bold", c)}>
        {LETTER[compound] ?? compound[0]}
      </span>
      {typeof age === "number" && <span className="text-neutral-400">L{age}</span>}
    </span>
  );
}
