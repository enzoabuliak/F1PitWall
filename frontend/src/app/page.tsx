"use client";

import { useLiveData } from "@/hooks/useLiveData";
import { useRaceStore } from "@/stores/raceStore";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { LiveDashboard } from "@/components/smart/LiveDashboard";
import { HomeScreen } from "@/components/smart/HomeScreen";

export default function RootPage() {
  useLiveData();
  const raceState = useRaceStore((s) => s.raceState);
  const isLive = raceState?.session_status === "live";

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      {isLive ? <LiveDashboard /> : <HomeScreen />}
    </div>
  );
}
