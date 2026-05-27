"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { TimingTower } from "@/components/smart/TimingTower";
import { WeatherWidget } from "@/components/smart/WeatherWidget";
import { Panel } from "@/components/atoms/Panel";

export default function LiveDashboardPage() {
  useLiveData();

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
        <Panel title="Live Timing" accent className="overflow-x-auto">
          <TimingTower />
        </Panel>
        <div className="space-y-4">
          <Panel title="Weather">
            <WeatherWidget />
          </Panel>
          <Panel title="Pit Wall">
            <div className="text-xs text-neutral-400 leading-relaxed font-mono">
              Streaming live OpenF1 data. Click any driver row to select for telemetry inspection.
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
