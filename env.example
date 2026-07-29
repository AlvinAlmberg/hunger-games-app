"use client";

import { useEffect, useRef, useState } from "react";
import MissionsMapView from "@/components/MissionsMapView";

type Participant = {
  id: string;
  name: string;
  status: "ALIVE" | "DEAD";
  gameId: string;
  gameName: string;
};

type Mission = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
};

type FeedEvent = {
  id: string;
  type: string;
  createdAt: string;
  victim?: { id: string; name: string } | null;
  killer?: { name: string } | null;
  weapon?: string | null;
  mission?: { id: string; title: string } | null;
  note?: string | null;
};

const POLL_INTERVAL_MS = 4000; // "några sekunders fördröjning räcker" — se arkitekturbeslut i README

const MISSION_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Väntar", className: "text-neutral-500" },
  ACTIVE: { label: "Pågår", className: "text-arena-accent" },
  COMPLETED: { label: "Klart", className: "text-green-400" },
  FAILED: { label: "Misslyckat", className: "text-arena-danger" },
};

export default function PlayerView({
  token,
  participant,
  otherParticipants,
  weapons,
  missions: initialMissions,
  initialEvents,
}: {
  token: string;
  participant: Participant;
  otherParticipants: { id: string; name: string }[];
  weapons: string[];
  missions: Mission[];
  initialEvents: FeedEvent[];
}) {
  const [status, setStatus] = useState(participant.status);
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [feed, setFeed] = useState<FeedEvent[]>(initialEvents);
  const [showKilledForm, setShowKilledForm] = useState(false);
  const [selectedKiller, setSelectedKiller] = useState("");
  const [selectedWeapon, setSelectedWeapon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastPollRef = useRef(new Date().toISOString());

  // Polling: hämtar senaste events för spelet sedan förra pollningen och
  // härleder allt UI-tillstånd från dem (status, uppdrag, händelseflöde).
  // Samma händelselogg driver alltså både admin- och deltagarvyn.
  useEffect(() => {
    if (status === "DEAD") return; // ingen anledning att fortsätta polla en död deltagare
    let cancelled = false;

    const poll = async () => {
      const since = lastPollRef.current;
      try {
        const res = await fetch(`/api/events?gameId=${participant.gameId}&since=${since}`);
        if (!res.ok) return;
        const events: FeedEvent[] = await res.json();
        if (cancelled || events.length === 0) return;

        lastPollRef.current = new Date().toISOString();

        for (const e of events) {
          if (e.type === "KILL" && e.victim?.id === participant.id) {
            setStatus("DEAD");
          }
          if (
            (e.type === "MISSION_COMPLETED" || e.type === "MISSION_FAILED") &&
            e.mission?.id
          ) {
            const newStatus = e.type === "MISSION_COMPLETED" ? "COMPLETED" : "FAILED";
            setMissions((prev) =>
              prev.map((m) => (m.id === e.mission!.id ? { ...m, status: newStatus } : m))
            );
          }
          if (e.type === "SYSTEM" && e.mission?.id) {
            setMissions((prev) =>
              prev.map((m) => (m.id === e.mission!.id ? { ...m, status: "ACTIVE" } : m))
            );
          }
        }

        setFeed((prev) => {
          const merged = [...events, ...prev];
          const seen = new Set<string>();
          const deduped = merged.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
          return deduped
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .slice(0, 20);
        });
      } catch {
        // Tyst fel vid tillfälligt nätverksbortfall — försöker igen nästa intervall.
        // TODO (fas 6): visa en diskret "återansluter…"-indikator vid upprepade fel.
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status, participant.gameId, participant.id]);

  async function submitDeath() {
    if (!selectedKiller || !selectedWeapon) {
      setError("Välj både vem som dödade dig och vilket vapen som användes.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: participant.gameId,
          victimId: participant.id,
          killerId: selectedKiller,
          weapon: selectedWeapon,
          reportedVia: "self",
          participantToken: token,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Något gick fel");
      }
      setStatus("DEAD");
      setShowKilledForm(false);
    } catch (e: any) {
      setError(e.message ?? "Något gick fel, försök igen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "DEAD") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-arena-bg p-6 text-center text-neutral-200">
        <h1 className="text-2xl font-bold text-arena-danger">Du är eliminerad</h1>
        <p className="text-sm text-neutral-400">{participant.gameName}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-arena-bg p-6 pb-28 text-neutral-200">
      <header>
        <p className="text-xs uppercase tracking-wide text-neutral-500">{participant.gameName}</p>
        <h1 className="text-2xl font-bold text-arena-accent">{participant.name}</h1>
        <p className="text-sm text-neutral-400">
          Status: <span className="text-green-400">Vid liv</span>
        </p>
      </header>

      {/* Karta med uppdrag */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Karta — uppdrag (🎯 = frizon)
        </h2>
        <MissionsMapView missions={missions} />
      </section>

      {/* Uppdrag */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Uppdrag</h2>
        {missions.length === 0 && <p className="text-sm text-neutral-500">Inga uppdrag ännu.</p>}
        <ul className="flex flex-col gap-2">
          {missions.map((m) => {
            const meta = MISSION_LABELS[m.status] ?? MISSION_LABELS.PENDING;
            return (
              <li key={m.id} className="rounded border border-neutral-800 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{m.title}</span>
                  <span className={`text-xs ${meta.className}`}>{meta.label}</span>
                </div>
                {m.description && <p className="mt-1 text-sm text-neutral-400">{m.description}</p>}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Händelseflöde */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Vad har hänt
        </h2>
        {feed.length === 0 && <p className="text-sm text-neutral-500">Inget har hänt ännu.</p>}
        <ul className="flex flex-col gap-1 text-sm text-neutral-300">
          {feed.map((e) => (
            <li key={e.id}>
              {e.type === "KILL" && (
                <>
                  <strong>{e.victim?.name}</strong> eliminerades av{" "}
                  <strong>{e.killer?.name}</strong> ({e.weapon})
                </>
              )}
              {e.type === "MISSION_COMPLETED" && (
                <>Uppdrag klart: <strong>{e.mission?.title}</strong></>
              )}
              {e.type === "MISSION_FAILED" && (
                <>Uppdrag misslyckat: <strong>{e.mission?.title}</strong></>
              )}
              {e.type === "SYSTEM" && (e.note ?? "Något hände i spelet")}
            </li>
          ))}
        </ul>
      </section>

      {/* Självrapport av eliminering — fast placerad längst ner så den alltid går att nå */}
      <div className="fixed bottom-0 left-0 right-0 bg-arena-bg p-4">
        {!showKilledForm ? (
          <button
            onClick={() => setShowKilledForm(true)}
            className="w-full rounded-lg bg-arena-danger px-4 py-3 font-semibold text-white"
          >
            Jag har blivit dödad
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-neutral-700 bg-arena-bg p-4">
            <p className="text-sm">Vem dödade dig och med vilket vapen?</p>

            <select
              className="rounded bg-neutral-800 p-2"
              value={selectedKiller}
              onChange={(e) => setSelectedKiller(e.target.value)}
            >
              <option value="">Välj mördare…</option>
              {otherParticipants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              className="rounded bg-neutral-800 p-2"
              value={selectedWeapon}
              onChange={(e) => setSelectedWeapon(e.target.value)}
            >
              <option value="">Välj vapen…</option>
              {weapons.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            {error && <p className="text-sm text-arena-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setShowKilledForm(false)}
                className="flex-1 rounded bg-neutral-700 py-2"
                disabled={submitting}
              >
                Avbryt
              </button>
              <button
                onClick={submitDeath}
                className="flex-1 rounded bg-arena-danger py-2 font-semibold"
                disabled={submitting}
              >
                {submitting ? "Skickar…" : "Bekräfta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
