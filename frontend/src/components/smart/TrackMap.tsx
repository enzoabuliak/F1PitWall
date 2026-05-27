"use client";

import { useEffect, useState } from "react";
import { fetchTrackMap } from "@/lib/api";
import type { TrackMap as TrackMapData } from "@/lib/types";

interface Props {
  refreshMs?: number;
}

const PADDING = 60;
const VIEW_W = 1000;
const VIEW_H = 600;

function project(
  pt: [number, number],
  bounds: TrackMapData["outline"]["bounds"],
): [number, number] {
  const dx = bounds.max_x - bounds.min_x || 1;
  const dy = bounds.max_y - bounds.min_y || 1;
  const scale = Math.min(
    (VIEW_W - PADDING * 2) / dx,
    (VIEW_H - PADDING * 2) / dy,
  );
  const offsetX = (VIEW_W - dx * scale) / 2 - bounds.min_x * scale;
  const offsetY = (VIEW_H - dy * scale) / 2 - bounds.min_y * scale;
  // flip Y so increasing y goes up
  const y = VIEW_H - (pt[1] * scale + offsetY);
  const x = pt[0] * scale + offsetX;
  return [x, y];
}

export function TrackMap({ refreshMs = 4000 }: Props) {
  const [data, setData] = useState<TrackMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const m = await fetchTrackMap();
        if (cancelled) return;
        if (m) {
          setData(m);
          setError(null);
        } else if (!data) {
          setError("Track map unavailable for this session");
        }
      } catch (e) {
        if (!cancelled && !data)
          setError(e instanceof Error ? e.message : "failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs]);

  if (loading && !data) {
    return (
      <div className="aspect-[5/3] w-full rounded-lg border border-white/10 bg-black/40 flex items-center justify-center">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 animate-pulse">
          Tracing circuit…
        </span>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="aspect-[5/3] w-full rounded-lg border border-white/10 bg-black/40 flex items-center justify-center">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500">
          {error ?? "No data"}
        </span>
      </div>
    );
  }

  const path = data.outline.points
    .map((p, i) => {
      const [x, y] = project(p, data.outline.bounds);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto rounded-lg border border-white/10 bg-gradient-to-br from-black via-[#0a0a0a] to-black"
        aria-label="Live track map with driver positions"
        role="img"
      >
        <defs>
          <filter id="track-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="car-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        {/* outer glow */}
        <path
          d={path}
          stroke="#DC0000"
          strokeWidth={14}
          strokeOpacity={0.18}
          fill="none"
          filter="url(#track-glow)"
        />
        {/* main track ribbon */}
        <path
          d={path}
          stroke="#3a3a3a"
          strokeWidth={9}
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d={path}
          stroke="#7a7a7a"
          strokeWidth={1.5}
          strokeDasharray="6 6"
          fill="none"
        />

        {/* drivers */}
        {data.positions.map((p) => {
          const [x, y] = project([p.x, p.y], data.outline.bounds);
          const fill = p.team_colour ? `#${p.team_colour}` : "#888";
          return (
            <g key={p.driver_number} className="transition-transform">
              <circle cx={x} cy={y} r={11} fill={fill} opacity={0.5} filter="url(#car-glow)" />
              <circle cx={x} cy={y} r={7} fill={fill} stroke="white" strokeWidth={1.2} />
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                fontSize="9"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fontWeight="900"
                fill="#fff"
              >
                {p.driver_number}
              </text>
              {p.name_acronym && (
                <text
                  x={x}
                  y={y - 14}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  fontWeight="700"
                  fill={fill}
                  stroke="#000"
                  strokeWidth={2.5}
                  paintOrder="stroke"
                >
                  {p.name_acronym}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function TrackMapLegend() {
  const [data, setData] = useState<TrackMapData | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const m = await fetchTrackMap();
      if (!cancelled) setData(m);
    }
    load();
    const id = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return <div className="text-xs text-neutral-500 font-mono">Loading…</div>;
  }
  return (
    <ol className="space-y-1">
      {data.positions.map((p) => (
        <li
          key={p.driver_number}
          className="flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono hover:bg-white/5 transition-colors"
        >
          <span className="text-neutral-500 w-5 text-right">
            {p.position ?? "—"}
          </span>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: p.team_colour ? `#${p.team_colour}` : "#888" }}
          />
          <span className="text-neutral-400 w-7">#{p.driver_number}</span>
          <span className="text-white truncate">
            {p.full_name?.split(" ").pop() ?? p.name_acronym ?? "?"}
          </span>
        </li>
      ))}
    </ol>
  );
}
