"use client";

import { useEffect, useState } from "react";
import { fetchLastRace, fetchSchedule } from "@/lib/api";
import type { LastRaceResults, ScheduleResponse } from "@/lib/types";

interface ScheduleData {
  schedule: ScheduleResponse | null;
  lastRace: LastRaceResults | null;
  loading: boolean;
  error: string | null;
}

export function useSchedule(): ScheduleData {
  const [data, setData] = useState<ScheduleData>({
    schedule: null,
    lastRace: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [s, lr] = await Promise.all([
          fetchSchedule(),
          fetchLastRace().catch(() => null),
        ]);
        if (cancelled) return;
        setData({ schedule: s, lastRace: lr, loading: false, error: null });
      } catch (e) {
        if (!cancelled)
          setData((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : "failed",
          }));
      }
    }

    load();
    const id = setInterval(load, 300_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return data;
}
