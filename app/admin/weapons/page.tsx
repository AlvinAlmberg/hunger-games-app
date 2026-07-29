"use client";

import { useEffect, useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";

type Weapon = { id: string; name: string };

export default function WeaponsPage() {
  
  const gameId = useQueryParam("gameId");

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [name, setName] = useState("");

  async function load() {
    if (!gameId) return;
    const res = await fetch(`/api/weapons?gameId=${gameId}`);
    setWeapons(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function createWeapon() {
    if (!name.trim() || !gameId) return;
    await fetch("/api/weapons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, name }),
    });
    setName("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Ta bort vapnet från listan?")) return;
    await fetch(`/api/weapons/${id}`, { method: "DELETE" });
    load();
  }

  if (!gameId) {
    return <p className="text-neutral-400">Välj ett spel under "Spel" först.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Vapen</h1>
      <p className="text-sm text-neutral-400">
        Detta är listan deltagare väljer ifrån när de rapporterar sin egen död.
      </p>

      <div className="flex gap-2">
        <input
          className="rounded bg-neutral-800 p-2"
          placeholder="Vapennamn"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={createWeapon} className="rounded bg-arena-accent px-4 py-2 font-semibold text-black">
          Lägg till vapen
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {weapons.map((w) => (
          <li key={w.id} className="flex items-center justify-between rounded border border-neutral-800 p-3">
            <span>{w.name}</span>
            <button onClick={() => remove(w.id)} className="text-sm text-arena-danger underline">Ta bort</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
