"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  url?: string | null;
  acronym?: string | null;
  teamColour?: string | null;
  size?: number;
  className?: string;
}

export function DriverAvatar({
  url,
  acronym,
  teamColour,
  size = 32,
  className,
}: Props) {
  const [errored, setErrored] = useState(false);
  const showImage = !!url && !errored;
  const colour = teamColour
    ? teamColour.startsWith("#")
      ? teamColour
      : `#${teamColour}`
    : "#444";
  const dim = `${size}px`;

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0",
        className,
      )}
      style={{
        width: dim,
        height: dim,
        background: `linear-gradient(135deg, ${colour}33, #00000044)`,
        boxShadow: `inset 0 0 0 1px ${colour}66`,
      }}
      aria-label={acronym ? `${acronym} headshot` : "Driver headshot"}
    >
      {showImage ? (
        // Plain img so it works in the static export without Next image opt
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url!}
          alt={acronym ?? "Driver"}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setErrored(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          className="font-mono font-black tracking-tighter text-white"
          style={{ fontSize: Math.max(9, size / 3) }}
        >
          {acronym ?? "?"}
        </span>
      )}
    </span>
  );
}
