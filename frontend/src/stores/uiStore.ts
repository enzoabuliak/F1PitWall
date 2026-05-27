import { create } from "zustand";

interface UIStoreState {
  selectedDriver: number | null;
  comparisonDrivers: number[];
  setSelectedDriver: (d: number | null) => void;
  toggleComparison: (d: number) => void;
}

export const useUIStore = create<UIStoreState>((set, get) => ({
  selectedDriver: null,
  comparisonDrivers: [],
  setSelectedDriver: (d) => set({ selectedDriver: d }),
  toggleComparison: (d) => {
    const cur = get().comparisonDrivers;
    set({
      comparisonDrivers: cur.includes(d)
        ? cur.filter((x) => x !== d)
        : [...cur, d].slice(-2),
    });
  },
}));
