"use client";

import { useEffect, useRef } from "react";
import { fetchRaceState, fetchTiming, WS_URL } from "@/lib/api";
import { useRaceStore } from "@/stores/raceStore";
import { useTimingStore } from "@/stores/timingStore";

export function useLiveData() {
  const setRaceState = useRaceStore((s) => s.setRaceState);
  const setWeather = useRaceStore((s) => s.setWeather);
  const setPositions = useTimingStore((s) => s.setPositions);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function pollOnce() {
      try {
        const [rs, tm] = await Promise.all([fetchRaceState(), fetchTiming()]);
        if (cancelled) return;
        setRaceState(rs.race_state);
        setWeather(rs.weather);
        setPositions(tm.timing);
      } catch (e) {
        console.warn("poll failed", e);
      }
    }

    function startPolling() {
      if (pollRef.current) return;
      pollOnce();
      pollRef.current = setInterval(pollOnce, 2000);
    }

    function stopPolling() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    function connectWS() {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {
          stopPolling();
        };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.race_state) setRaceState(msg.race_state);
            if (Array.isArray(msg.timing)) setPositions(msg.timing);
          } catch {}
        };
        ws.onerror = () => {
          startPolling();
        };
        ws.onclose = () => {
          wsRef.current = null;
          startPolling();
          if (!cancelled) setTimeout(connectWS, 5000);
        };
      } catch {
        startPolling();
      }
    }

    pollOnce();
    connectWS();

    return () => {
      cancelled = true;
      stopPolling();
      wsRef.current?.close();
    };
  }, [setRaceState, setWeather, setPositions]);
}
