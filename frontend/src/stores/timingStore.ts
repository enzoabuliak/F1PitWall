import { create } from "zustand";
import type { DriverPosition } from "@/lib/types";

interface TimingStoreState {
  positions: DriverPosition[];
  lastUpdate: number;
  setPositions: (positions: DriverPosition[]) => void;
}

export const useTimingStore = create<TimingStoreState>((set) => ({
  positions: [],
  lastUpdate: 0,
  setPositions: (positions) => set({ positions, lastUpdate: Date.now() }),
}));
