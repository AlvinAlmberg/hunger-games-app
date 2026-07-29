export default function AdminDashboard() {
  // TODO (fas 5): live-statistik här — antal vid liv/döda, senaste kills, aktiva uppdrag.
  return (
    <div>
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p className="mt-2 text-neutral-400">
        Välj ett spel under "Spel" för att hantera deltagare, uppdrag och se
        händelseloggen live.
      </p>
    </div>
  );
}
