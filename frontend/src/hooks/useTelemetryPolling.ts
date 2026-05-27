"use client";

import { useEffect } from "react";
import { fetchTelemetry } from "@/lib/api";
import { useTelemetryStore } from "@/stores/telemetryStore";

export function useTelemetryPolling(driverNumber: number | null, intervalMs = 1000) {
  const addFrame = useTelemetryStore((s) => s.addFrame);

  useEffect(() => {
    if (driverNumber == null) return;
    let cancelled = false;

    async function poll() {
      try {
        const frame = await fetchTelemetry(driverNumber!);
        if (!cancelled && frame) addFrame(frame);
      } catch {}
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [driverNumber, intervalMs, addFrame]);
}
