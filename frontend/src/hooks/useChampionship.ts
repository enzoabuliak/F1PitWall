"use client";

import { useEffect, useState } from "react";
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

export function useChampionship(): ChampionshipData {
  const [data, setData] = useState<ChampionshipData>({
    teams: [],
    drivers: [],
    constructors: [],
    year: null,
    loading: true,
  });

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
        setData({
          teams: t.teams,
          drivers: d.standings,
          constructors: c.standings,
          year: d.year,
          loading: false,
        });
      } catch {
        if (!cancelled) setData((s) => ({ ...s, loading: false }));
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return data;
}
