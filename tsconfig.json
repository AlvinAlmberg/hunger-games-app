"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Genererar QR-koden helt client-side (ingen extern QR-API-tjänst).
// Motiverat av: (1) tokens ska inte skickas till en tredjepartstjänst,
// (2) ingen extern beroende som kan gå ner under själva eventet.
export default function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded bg-neutral-800 text-xs text-neutral-500"
      >
        Genererar…
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR-kod" width={size} height={size} className="rounded bg-white p-2" />;
}
