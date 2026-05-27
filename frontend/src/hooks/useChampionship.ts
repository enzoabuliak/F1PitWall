"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchConstructorStandings,
  fetchDriverStandings,
  fetchTeams,
} from "@/lib/api";
import type {
  ConstructorStanding,
  DriverStanding,
  Team,
} from "@/lib/types";

interface ChampionshipData {
  teams: Team[];
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  year: number | null;
  loading: boolean;
}

const FAST_RETRY_MS = 4000;
const STEADY_REFRESH_MS = 60_000;
const FAST_RETRY_MAX = 12;

export function useChampionship(): ChampionshipData {
  const [data, setData] = useState<ChampionshipData>({
    teams: [],
    drivers: [],
    constructors: [],
    year: null,
    loading: true,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [t, d, c] = await Promise.all([
          fetchTeams(),
          fetchDriverStandings(),
          fetchConstructorStandings(),
        ]);
        if (cancelled) return;
        const hasData = d.standings.length > 0 || c.standings.length > 0;
        setData({
          teams: t.teams,
          drivers: d.standings,
          constructors: c.standings,
          year: d.year ?? c.year ?? null,
          loading: !hasData,
        });
        schedule(hasData);
      } catch {
        if (!cancelled) {
          setData((s) => ({ ...s, loading: !s.drivers.length && !s.constructors.length }));
          schedule(false);
        }
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
