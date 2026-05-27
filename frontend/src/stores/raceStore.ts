import { create } from "zustand";
import type { RaceState, Weather } from "@/lib/types";

interface RaceStoreState {
  raceState: RaceState | null;
  weather: Weather | null;
  setRaceState: (s: RaceState | null) => void;
  setWeather: (w: Weather | null) => void;
}

export const useRaceStore = create<RaceStoreState>((set) => ({
  raceState: null,
  weather: null,
  setRaceState: (s) => set({ raceState: s }),
  setWeather: (w) => set({ weather: w }),
}));
