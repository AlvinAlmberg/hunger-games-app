"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryParam } from "@/lib/use-query-param";

export default function AdminLoginPage() {
  const router = useRouter();
  const from = useQueryParam("from") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
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
    router.push(from);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-neutral-100">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-neutral-800 p-6"
      >
        <h1 className="mb-2 text-xl font-bold text-arena-accent">Admin-inloggning</h1>

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
          placeholder="Lösenord"
          className="rounded bg-neutral-800 p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-arena-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-arena-accent py-2 font-semibold text-black"
        >
          {loading ? "Loggar in…" : "Logga in"}
        </button>
      </form>
    </main>
  );
}
