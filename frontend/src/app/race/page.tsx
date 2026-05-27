"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { ReplayBanner } from "@/components/atoms/ReplayBanner";
import { LiveDashboard } from "@/components/smart/LiveDashboard";

export default function RacePage() {
  useLiveData();
  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <ReplayBanner />
      <LiveDashboard />
    </div>
  );
}
