"use client";

import { useRaceStore } from "@/stores/raceStore";
import { TimingNumber } from "@/components/atoms/TimingNumber";

export function WeatherWidget() {
  const weather = useRaceStore((s) => s.weather);
  if (!weather) {
    return <div className="text-xs text-neutral-500 font-mono">No weather data</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <Stat label="Air" value={weather.air_temperature} unit="°C" />
      <Stat label="Track" value={weather.track_temperature} unit="°C" />
      <Stat label="Humidity" value={weather.humidity} unit="%" />
      <Stat label="Wind" value={weather.wind_speed} unit="m/s" />
      <Stat label="Pressure" value={weather.pressure} unit="hPa" />
      <div className="flex items-center justify-between">
        <span className="text-neutral-500 uppercase text-[10px] tracking-wider">Rain</span>
        <span className={weather.rainfall ? "text-blue-400 font-mono" : "text-neutral-400 font-mono"}>
          {weather.rainfall ? "YES" : "NO"}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500 uppercase text-[10px] tracking-wider">{label}</span>
      <span className="font-mono">
        <TimingNumber value={value} format="raw" className="text-xs" /> <span className="text-neutral-500">{unit}</span>
      </span>
    </div>
  );
}
