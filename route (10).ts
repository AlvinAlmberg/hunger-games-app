"use client";

import { useEffect, useState } from "react";

type Game = {
  id: string;
  name: string;
  status: string;
  _count: { participants: number };
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadGames() {
    const res = await fetch("/api/games");
    setGames(await res.json());
  }

  useEffect(() => {
    loadGames();
  }, []);

  async function createGame() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    setLoading(false);
    loadGames();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Spel</h1>

      <div className="flex gap-2">
        <input
          className="rounded bg-neutral-800 p-2"
          placeholder="Ex: Hunger Games 2027"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={createGame}
          disabled={loading}
          className="rounded bg-arena-accent px-4 py-2 font-semibold text-black"
        >
          Skapa spel
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {games.map((g) => (
          <li key={g.id} className="rounded border border-neutral-800 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{g.name}</p>
                <p className="text-xs text-neutral-500">
                  {g.status} · {g._count.participants} deltagare
                </p>
              </div>
              <a
                href={`/admin/participants?gameId=${g.id}`}
                className="text-sm text-arena-accent underline"
              >
                Hantera deltagare
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
