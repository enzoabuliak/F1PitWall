"use client";

import { useEffect, useState } from "react";
import { useLiveData } from "@/hooks/useLiveData";
import { useChampionship } from "@/hooks/useChampionship";
import { SessionHeader } from "@/components/smart/SessionHeader";
import { TeamPicker } from "@/components/smart/TeamPicker";
import { TeamDriverCard } from "@/components/smart/TeamDriverCard";
import { Panel } from "@/components/atoms/Panel";
import { ReplayBanner } from "@/components/atoms/ReplayBanner";
import type { DriverStanding } from "@/lib/types";

function findStanding(
  drivers: DriverStanding[],
  driverNumber: number,
  fullName: string | null,
): DriverStanding | null {
  const byNum = drivers.find((d) => d.driver_number === driverNumber);
  if (byNum) return byNum;
  if (!fullName) return null;
  const norm = fullName.toLowerCase();
  return (
    drivers.find((d) => {
      const dn = d.full_name.toLowerCase();
      return dn === norm || norm.includes(d.full_name.split(" ").pop()!.toLowerCase());
    }) ?? null
  );
}

export default function TeamPage() {
  useLiveData();
  const { teams, drivers, constructors, year, loading } = useChampionship();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!selected && teams.length) {
      setSelected(teams[0].team_name);
    }
  }, [teams, selected]);

  const team = teams.find((t) => t.team_name === selected) ?? null;
  const constructor =
    constructors.find(
      (c) =>
        c.team_name.toLowerCase() === selected?.toLowerCase() ||
        c.team_name.toLowerCase().includes(selected?.toLowerCase() ?? "") ||
        (selected?.toLowerCase() ?? "").includes(c.team_name.toLowerCase()),
    ) ?? null;

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader />
      <ReplayBanner />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 p-4">
        <div className="space-y-4">
          <Panel title={`Teams${year ? ` · ${year}` : ""}`}>
            <TeamPicker
              teams={teams}
              selected={selected}
              onSelect={setSelected}
            />
          </Panel>

          <Panel title="Constructor Championship">
            {loading && !constructors.length ? (
              <div className="text-xs text-neutral-500 font-mono">Loading…</div>
            ) : (
              <ol className="space-y-1">
                {constructors.slice(0, 10).map((c) => {
                  const active = c.team_name === selected || c.team_name === team?.team_name;
                  return (
                    <li
                      key={c.team_name}
                      className={
                        "flex items-center justify-between text-xs font-mono py-1 px-2 rounded " +
                        (active ? "bg-[#DC0000]/15 text-white" : "text-neutral-400")
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-neutral-500 w-5 text-right">P{c.position}</span>
                        <span className="truncate">{c.team_name}</span>
                      </span>
                      <span className="text-[#00ff9c]">{c.points}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          {team ? (
            <>
              <Panel
                title={`${team.team_name} · Pit Wall`}
                accent
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        Constructor pos.
                      </div>
                      <div className="text-3xl font-mono font-black text-[#00ff9c]">
                        {constructor ? `P${constructor.position}` : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        Points
                      </div>
                      <div className="text-3xl font-mono font-black text-white">
                        {constructor?.points ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        Season wins
                      </div>
                      <div className="text-3xl font-mono font-black text-white">
                        {constructor?.wins ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        Nationality
                      </div>
                      <div className="text-sm font-mono text-white mt-2">
                        {constructor?.nationality ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
                      Lineup
                    </div>
                    <ul className="space-y-2">
                      {team.drivers.map((d) => {
                        const s = findStanding(drivers, d.driver_number, d.full_name);
                        return (
                          <li key={d.driver_number} className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-white font-medium">
                                #{d.driver_number} {d.full_name}
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                                Champ {s ? `P${s.position} · ${s.points} pts` : "—"}
                              </div>
                            </div>
                            <span
                              className="w-1 h-7 rounded"
                              style={{
                                backgroundColor: team.team_colour
                                  ? `#${team.team_colour}`
                                  : "#666",
                              }}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </Panel>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {team.drivers.map((d) => (
                  <TeamDriverCard
                    key={d.driver_number}
                    driver={d}
                    teamColour={team.team_colour}
                    standing={findStanding(drivers, d.driver_number, d.full_name)}
                  />
                ))}
              </div>
            </>
          ) : (
            <Panel title="Team">
              <div className="py-12 text-center text-sm text-neutral-500 font-mono">
                Select a team from the panel on the left
              </div>
            </Panel>
          )}
        </div>
      </main>
    </div>
  );
}
