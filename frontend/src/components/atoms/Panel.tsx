import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Panel({ children, className, title, accent }: { children: ReactNode; className?: string; title?: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl",
        "shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
        accent && "border-[#DC0000]/40",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{title}</h2>
          {accent && <span className="h-2 w-2 rounded-full bg-[#DC0000] shadow-[0_0_8px_#DC0000]" />}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
