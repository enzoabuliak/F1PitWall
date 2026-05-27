"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { ReplayBanner } from "@/components/atoms/ReplayBanner";
import { Panel } from "@/components/atoms/Panel";
import { TrackMap, TrackMapLegend } from "@/components/smart/TrackMap";

export default function TrackPage() {
  useLiveData();
  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <ReplayBanner />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 p-4">
        <Panel title="Circuit · Live Track Map" accent>
          <TrackMap refreshMs={4000} />
        </Panel>
        <Panel title="Cars on track">
          <TrackMapLegend />
        </Panel>
      </main>
    </div>
  );
}
