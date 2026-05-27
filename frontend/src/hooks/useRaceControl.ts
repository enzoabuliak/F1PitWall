"use client";

import { useEffect, useState } from "react";
import { fetchRaceControl } from "@/lib/api";
import type { RaceControlResponse } from "@/lib/types";

export function useRaceControl(refreshMs = 8000) {
  const [data, setData] = useState<RaceControlResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const r = await fetchRaceControl();
      if (!cancelled) setData(r);
    }
    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshMs]);

  return data;
}
