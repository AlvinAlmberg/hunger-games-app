"use client";

import { useEffect, useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";

type GameEvent = {
  id: string;
  type: string;
  victim?: { name: string } | null;
  killer?: { name: string } | null;
  weapon?: string | null;
  reportedVia?: string | null;
  mission?: { title: string } | null;
  note?: string | null;
  createdAt: string;
  editedAt?: string | null;
};

const POLL_INTERVAL_MS = 4000;

export default function EventsPage() {
  
  const gameId = useQueryParam("gameId");
  const [events, setEvents] = useState<GameEvent[]>([]);

  async function load() {
    if (!gameId) return;
    const res = await fetch(`/api/events?gameId=${gameId}`);
    setEvents(await res.json());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function revertEvent(id: string) {
    if (!confirm("Ångra detta kill-event och återuppliva deltagaren?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    load();
  }

  if (!gameId) {
    return <p className="text-neutral-400">Välj ett spel under "Spel" först.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Händelselogg</h1>
      <p className="text-xs text-neutral-500">
        Uppdateras automatiskt var {POLL_INTERVAL_MS / 1000}:e sekund.
      </p>

      <ul className="flex flex-col gap-2">
        {events.map((e) => (
          <li key={e.id} className="rounded border border-neutral-800 p-3 text-sm">
            {e.type === "KILL" && (
              <div className="flex items-center justify-between">
                <span>
                  <strong>{e.victim?.name}</strong> dödades av{" "}
                  <strong>{e.killer?.name}</strong> med {e.weapon}
                  {e.reportedVia === "self" ? " (självrapporterat)" : " (admin)"}
                  {e.editedAt ? " · redigerad" : ""}
                </span>
                <button
                  onClick={() => revertEvent(e.id)}
                  className="text-xs text-arena-danger underline"
                >
                  Ångra
                </button>
              </div>
            )}
            {e.type !== "KILL" && (
              <span>
                {e.type === "MISSION_COMPLETED" && (
                  <>
                    Uppdrag klart: <strong>{e.mission?.title}</strong>
                  </>
                )}
                {e.type === "MISSION_FAILED" && (
                  <>
                    Uppdrag misslyckat: <strong>{e.mission?.title}</strong>
                  </>
                )}
                {e.type === "KILL_REVERTED" && (
                  <>
                    <strong>{e.victim?.name}</strong> återupplivad (kill-event ångrat)
                  </>
                )}
                {e.type === "SYSTEM" && (e.note ?? "Systemhändelse")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
