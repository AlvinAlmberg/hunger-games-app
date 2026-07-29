"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alreadySetUp, setAlreadySetUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/setup")
      .then((res) => res.json())
      .then((data) => setAlreadySetUp(Boolean(data.alreadySetUp)))
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Något gick fel");
      return;
    }
    setDone(true);
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Kontrollerar…
      </main>
    );
  }

  if (alreadySetUp && !done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-950 p-6 text-center text-neutral-100">
        <h1 className="text-xl font-bold">Installationen är redan klar</h1>
        <p className="text-neutral-400">Det finns redan ett admin-konto för detta event.</p>
        <a href="/login" className="text-arena-accent underline">Gå till inloggningen</a>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-950 p-6 text-center text-neutral-100">
        <h1 className="text-xl font-bold text-arena-accent">Admin-konto skapat!</h1>
        <a href="/login" className="text-arena-accent underline">Logga in nu</a>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-neutral-100">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-neutral-800 p-6"
      >
        <h1 className="mb-1 text-xl font-bold text-arena-accent">Välkommen</h1>
        <p className="mb-2 text-sm text-neutral-400">
          Skapa ditt admin-konto för att komma igång. Denna sida fungerar bara en gång.
        </p>

        <input
          type="email"
          placeholder="E-post"
          className="rounded bg-neutral-800 p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Lösenord (minst 8 tecken)"
          className="rounded bg-neutral-800 p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <input
          type="password"
          placeholder="Bekräfta lösenord"
          className="rounded bg-neutral-800 p-2"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-arena-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-arena-accent py-2 font-semibold text-black"
        >
          {loading ? "Skapar…" : "Skapa admin-konto"}
        </button>
      </form>
    </main>
  );
}
