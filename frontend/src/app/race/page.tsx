"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { ReplayBanner } from "@/components/atoms/ReplayBanner";
import { FlagStrip } from "@/components/smart/FlagStrip";
import { LiveDashboard } from "@/components/smart/LiveDashboard";

export default function RacePage() {
  useLiveData();
  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <FlagStrip />
      <ReplayBanner />
      <LiveDashboard />
    </div>
  );
}
