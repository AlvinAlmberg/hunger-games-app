"use client";

import { useEffect, useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";
import QrCode from "@/components/QrCode";

type Participant = {
  id: string;
  name: string;
  status: "ALIVE" | "DEAD";
  qrToken: string;
};

export default function ParticipantsPage() {
  const gameId = useQueryParam("gameId");

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [openQrFor, setOpenQrFor] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function load() {
    if (!gameId) return;
    const res = await fetch(`/api/participants?gameId=${gameId}`);
    setParticipants(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function createParticipant() {
    if (!name.trim() || !gameId) return;
    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, name }),
    });
    const created = await res.json();
    setName("");
    setOpenQrFor(created.id);
    load();
  }

  if (!gameId) {
    return <p className="text-neutral-400">Välj ett spel under "Spel" först.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Deltagare</h1>

      <div className="flex gap-2">
        <input
          className="rounded bg-neutral-800 p-2"
          placeholder="Deltagarens namn"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={createParticipant}
          className="rounded bg-arena-accent px-4 py-2 font-semibold text-black"
        >
          Lägg till deltagare
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {participants.map((p) => {
          const playUrl = `${origin}/play/${p.qrToken}`;
          const isOpen = openQrFor === p.id;
          return (
            <li key={p.id} className="rounded border border-neutral-800 p-3">
              <div className="flex items-center justify-between gap-3">
                <span>{p.name}</span>
                <div className="flex items-center gap-3">
                  <span className={p.status === "ALIVE" ? "text-green-400" : "text-arena-danger"}>
                    {p.status === "ALIVE" ? "Vid liv" : "Eliminerad"}
                  </span>
                  <button
                    onClick={() => setOpenQrFor(isOpen ? null : p.id)}
                    className="text-sm text-arena-accent underline"
                  >
                    {isOpen ? "Dölj QR" : "Visa QR"}
                  </button>
                </div>
              </div>

              {isOpen && origin && (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <QrCode value={playUrl} />
                  <p className="break-all text-xs text-neutral-500">{playUrl}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
