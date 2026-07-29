"use client";

import dynamic from "next/dynamic";

const MissionLocationPickerInner = dynamic(() => import("./MissionLocationPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded border border-neutral-800 text-sm text-neutral-500">
      Laddar karta…
    </div>
  ),
});

export default MissionLocationPickerInner;
