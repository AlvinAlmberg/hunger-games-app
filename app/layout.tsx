import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hunger Games Live",
  description: "Live-event-app för Hunger Games-inspirerade spel",
  manifest: "/manifest.json",
};

// mobile-first: låser zoom och fyller skärmen, viktigt för ett event där
// deltagarna använder telefonen som sin enda "spelkonsol"
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0d0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
