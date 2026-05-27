"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { FlagStrip } from "@/components/smart/FlagStrip";
import { ReplayBanner } from "@/components/atoms/ReplayBanner";
import { Panel } from "@/components/atoms/Panel";
import { TrackMap, TrackMapLegend } from "@/components/smart/TrackMap";
import { RaceControlPanel } from "@/components/smart/RaceControlPanel";

export default function TrackPage() {
  useLiveData();
  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <FlagStrip />
      <ReplayBanner />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 p-4">
        <Panel title="Circuit · Live Track Map" accent>
          <TrackMap refreshMs={4000} />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded-full bg-[#00ff9c] shadow-[0_0_6px_#00ff9c]" />
              <span className="text-neutral-300 normal-case tracking-normal">DRS zones (leader&apos;s lap)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-[#DC0000]" />
              <span className="text-neutral-300 normal-case tracking-normal">Driver dot</span>
            </span>
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Cars on track">
            <TrackMapLegend />
          </Panel>
          <Panel title="Race Control">
            <RaceControlPanel />
          </Panel>
        </div>
      </main>
    </div>
  );
}
