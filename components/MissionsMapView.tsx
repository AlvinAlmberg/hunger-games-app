"use client";

import dynamic from "next/dynamic";

// ssr: false är nödvändigt eftersom Leaflet läser `window` vid modul-laddning,
// vilket kraschar under server-rendering. Måste ligga i en "use client"-fil
// (Next.js tillåter inte ssr:false i Server Components).
const MissionsMapViewInner = dynamic(() => import("./MissionsMapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded border border-neutral-800 text-sm text-neutral-500">
      Laddar karta…
    </div>
  ),
});

export default MissionsMapViewInner;
