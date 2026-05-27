"use client";

import { TimingTower } from "@/components/smart/TimingTower";
import { WeatherWidget } from "@/components/smart/WeatherWidget";
import { RaceControlPanel } from "@/components/smart/RaceControlPanel";
import { Panel } from "@/components/atoms/Panel";

export function LiveDashboard() {
  return (
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
      <Panel title="Live Timing" accent className="overflow-x-auto">
        <TimingTower />
      </Panel>
      <div className="space-y-4">
        <Panel title="Weather">
          <WeatherWidget />
        </Panel>
        <Panel title="Race Control">
          <RaceControlPanel />
        </Panel>
      </div>
    </main>
  );
}
