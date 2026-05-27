"use client";

import { useEffect, useState } from "react";
import { fetchDrs } from "@/lib/api";
import type { DrsResponse } from "@/lib/types";

const EMPTY: DrsResponse["drs"] = {};

export function useDrs(refreshMs = 3000): DrsResponse["drs"] {
  const [data, setData] = useState<DrsResponse["drs"]>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const r = await fetchDrs();
      if (!cancelled && r) setData(r.drs);
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
