"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLastRace, fetchSchedule } from "@/lib/api";
import type { LastRaceResults, ScheduleResponse } from "@/lib/types";

interface ScheduleData {
  schedule: ScheduleResponse | null;
  lastRace: LastRaceResults | null;
  loading: boolean;
  error: string | null;
}

const FAST_RETRY_MS = 4000;
const STEADY_REFRESH_MS = 300_000;
const FAST_RETRY_MAX = 12; // ~48s of fast retries before backing off

export function useSchedule(): ScheduleData {
  const [data, setData] = useState<ScheduleData>({
    schedule: null,
    lastRace: null,
    loading: true,
    error: null,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [s, lr] = await Promise.all([
          fetchSchedule(),
          fetchLastRace().catch(() => null),
        ]);
        if (cancelled) return;
        const hasSchedule = !!s && Array.isArray(s.schedule) && s.schedule.length > 0;
        setData({
          schedule: s,
          lastRace: lr,
          loading: !hasSchedule,
          error: hasSchedule ? null : "no schedule",
        });
        schedule(hasSchedule);
      } catch (e) {
        if (cancelled) return;
        setData((prev) => ({
          ...prev,
          loading: !prev.schedule,
          error: e instanceof Error ? e.message : "failed",
        }));
        schedule(false);
      }
    }

    function schedule(haveData: boolean) {
      if (cancelled) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      let delay: number;
      if (haveData) {
        retriesRef.current = 0;
        delay = STEADY_REFRESH_MS;
      } else if (retriesRef.current < FAST_RETRY_MAX) {
        retriesRef.current += 1;
        delay = FAST_RETRY_MS;
      } else {
        delay = STEADY_REFRESH_MS;
      }
      timerRef.current = setTimeout(load, delay);
    }

    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return data;
}
