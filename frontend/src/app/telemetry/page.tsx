"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { useTelemetryPolling } from "@/hooks/useTelemetryPolling";
import { useUIStore } from "@/stores/uiStore";
import { useTimingStore } from "@/stores/timingStore";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { DriverSelect } from "@/components/smart/DriverSelect";
import { TelemetryGraph, GearDrsPanel } from "@/components/smart/TelemetryGraph";
import { Panel } from "@/components/atoms/Panel";

export default function TelemetryPage() {
  useLiveData();
  const selected = useUIStore((s) => s.selectedDriver);
  const driver = useTimingStore((s) =>
    s.positions.find((d) => d.driver_number === selected),
  );
  useTelemetryPolling(selected, 1000);

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 p-4">
        <Panel title="Drivers">
          <DriverSelect />
        </Panel>
        <div className="space-y-4">
          <Panel
            title={driver ? `Telemetry · ${driver.full_name}` : "Telemetry"}
            accent={!!driver}
          >
            {!selected ? (
              <div className="py-12 text-center text-sm text-neutral-500 font-mono">
                Select a driver from the panel on the left
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <span
                    className="w-1 h-6 rounded-sm"
                    style={{
                      backgroundColor: driver?.team_colour
                        ? `#${driver.team_colour}`
                        : "#666",
                    }}
                  />
                  <div>
                    <div className="text-sm font-bold text-white">
                      #{driver?.driver_number} {driver?.full_name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                      {driver?.team_name ?? "—"}
                    </div>
                  </div>
                  <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                    P{driver?.position ?? "—"} · {driver?.tire_compound ?? "—"}
                  </div>
                </div>
                <GearDrsPanel driverNumber={selected} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <TelemetryGraph
                    driverNumber={selected}
                    field="throttle"
                    color="#00ff9c"
                    label="Throttle"
                    unit="%"
                    domain={[0, 100]}
                  />
                  <TelemetryGraph
                    driverNumber={selected}
                    field="brake"
                    color="#DC0000"
                    label="Brake"
                    unit="%"
                    domain={[0, 100]}
                  />
                  <TelemetryGraph
                    driverNumber={selected}
                    field="speed"
                    color="#3FA9F5"
                    label="Speed"
                    unit="km/h"
                  />
                  <TelemetryGraph
                    driverNumber={selected}
                    field="rpm"
                    color="#FFB800"
                    label="RPM"
                  />
                </div>
              </div>
            )}
          </Panel>
        </div>
      </main>
    </div>
  );
}
