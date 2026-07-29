export default function HomePage() {
  // Deltagare ska aldrig landa här i praktiken — de går direkt in via sin
  // personliga QR-länk (/play/[token]). Den här sidan är en enkel
  // startpunkt/placeholder och länk till adminpanelen.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-arena-accent">Hunger Games Live</h1>
      <p className="text-sm text-neutral-400">
        Deltagare kommer åt sin vy via en personlig QR-kod.
      </p>
      <a href="/admin" className="text-arena-accent underline">
        Till adminpanelen
      </a>
    </main>
  );
}
