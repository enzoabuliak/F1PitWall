import { create } from "zustand";
import type { TelemetryFrame } from "@/lib/types";

const BUFFER_SIZE = 60;

interface TelemetryStoreState {
  buffers: Map<number, TelemetryFrame[]>;
  addFrame: (frame: TelemetryFrame) => void;
  getBuffer: (driverNumber: number) => TelemetryFrame[];
  clear: (driverNumber?: number) => void;
}

export const useTelemetryStore = create<TelemetryStoreState>((set, get) => ({
  buffers: new Map(),
  addFrame: (frame) =>
    set((state) => {
      const next = new Map(state.buffers);
      const buf = next.get(frame.driver_number) ?? [];
      const updated = [...buf, frame].slice(-BUFFER_SIZE);
      next.set(frame.driver_number, updated);
      return { buffers: next };
    }),
  getBuffer: (driverNumber) => get().buffers.get(driverNumber) ?? [],
  clear: (driverNumber) =>
    set((state) => {
      if (driverNumber === undefined) return { buffers: new Map() };
      const next = new Map(state.buffers);
      next.delete(driverNumber);
      return { buffers: next };
    }),
}));
