"use client";

import { useEffect, useState } from "react";

// Ersätter next/navigation:s useSearchParams för dessa enkla admin-sidor.
// Anledning: useSearchParams() kräver en Suspense-boundary runt varje
// användande sida för att `next build` inte ska felas ("should be wrapped
// in a suspense boundary"). Eftersom dessa sidor ändå är rent klientdrivna
// (ingen server-rendering av innehållet beror på parametern) är det enklare
// och mindre kod att läsa window.location.search direkt.
export function useQueryParam(key: string): string | null {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(key));
  }, [key]);

  return value;
}
