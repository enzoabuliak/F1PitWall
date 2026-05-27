"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { ReplayBanner } from "@/components/atoms/ReplayBanner";
import { Panel } from "@/components/atoms/Panel";
import { StrategyTimeline } from "@/components/smart/StrategyTimeline";
import { StrategyStats } from "@/components/smart/StrategyStats";
import { StrategyAdvisor } from "@/components/smart/StrategyAdvisor";

export default function StrategyPage() {
  useLiveData();
  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <ReplayBanner />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
        <div className="space-y-4">
          <Panel title="Tire Strategy · Stint Timeline" accent>
            <StrategyTimeline />
          </Panel>
          <Panel title="Strategy Advisor" accent>
            <StrategyAdvisor />
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Race Strategy Stats">
            <StrategyStats />
          </Panel>
          <Panel title="Reading the chart">
            <ul className="text-xs text-neutral-400 space-y-2 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[#FF4747]">●</span>
                <span>Each bar is one stint, coloured by tire compound.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-500">○</span>
                <span>Bar width is the stint length as a share of total race laps.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-500">○</span>
                <span>Stops column shows pit stops per driver (stints − 1).</span>
              </li>
            </ul>
          </Panel>
        </div>
      </main>
    </div>
  );
}
