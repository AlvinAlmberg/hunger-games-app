"use client";

import { useEffect, useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";
import MissionLocationPicker from "@/components/MissionLocationPicker";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ej startat",
  ACTIVE: "Aktivt",
  COMPLETED: "Klart",
  FAILED: "Misslyckat",
};

export default function MissionsPage() {
  const gameId = useQueryParam("gameId");

  const [missions, setMissions] = useState<Mission[]>([]);
  const [title, setTitle] = useState("");
  const [openMapFor, setOpenMapFor] = useState<string | null>(null);

  async function load() {
    if (!gameId) return;
    const res = await fetch(`/api/missions?gameId=${gameId}`);
    setMissions(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function createMission() {
    if (!title.trim() || !gameId) return;
    await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, title }),
    });
    setTitle("");
    load();
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/missions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function setLocation(id: string, lat: number, lng: number) {
    await fetch(`/api/missions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });
    // Uppdaterar inte listan direkt här (skulle avmontera kartan mitt i klick) —
    // load() körs istället när admin stänger kart-panelen.
  }

  async function remove(id: string) {
    if (!confirm("Ta bort uppdraget?")) return;
    await fetch(`/api/missions/${id}`, { method: "DELETE" });
    load();
  }

  if (!gameId) {
    return <p className="text-neutral-400">Välj ett spel under "Spel" först.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Uppdrag</h1>
      <p className="text-sm text-neutral-400">
        Varje uppdrag är en ikon på kartan och fungerar som en frizon (informativt — se README).
      </p>

      <div className="flex gap-2">
        <input
          className="rounded bg-neutral-800 p-2"
          placeholder="Uppdragets titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button onClick={createMission} className="rounded bg-arena-accent px-4 py-2 font-semibold text-black">
          Lägg till uppdrag
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {missions.map((m) => {
          const isMapOpen = openMapFor === m.id;
          const hasLocation = m.latitude != null && m.longitude != null;
          return (
            <li key={m.id} className="rounded border border-neutral-800 p-3">
              <div className="flex items-center justify-between">
                <span>{m.title}</span>
                <div className="flex items-center gap-3 text-sm">
                  <select
                    value={m.status}
                    onChange={(e) => setStatus(m.id, e.target.value)}
                    className="rounded bg-neutral-800 p-1"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const next = isMapOpen ? null : m.id;
                      setOpenMapFor(next);
                      if (isMapOpen) load(); // stäng -> säkerställ att listan har senaste koordinaterna
                    }}
                    className="text-arena-accent underline"
                  >
                    {hasLocation ? "Ändra plats" : "Sätt plats"}
                  </button>
                  <button onClick={() => remove(m.id)} className="text-arena-danger underline">Ta bort</button>
                </div>
              </div>

              {isMapOpen && (
                <div className="mt-3">
                  <MissionLocationPicker
                    initialLat={m.latitude}
                    initialLng={m.longitude}
                    onChange={(lat, lng) => setLocation(m.id, lat, lng)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
