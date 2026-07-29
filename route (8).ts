import LogoutButton from "./LogoutButton";

// Autentisering hanteras av middleware.ts, som redirectar till /admin/login
// om ingen giltig admin-session finns. /admin/login är själv undantagen
// (annars skulle man aldrig kunna nå inloggningssidan).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <nav className="flex items-center justify-between border-b border-neutral-800 p-4 text-sm">
        <div className="flex gap-4">
          <a href="/admin" className="font-bold text-arena-accent">Admin</a>
          <a href="/admin/games">Spel</a>
          <a href="/admin/participants">Deltagare</a>
          <a href="/admin/missions">Uppdrag</a>
          <a href="/admin/weapons">Vapen</a>
          <a href="/admin/events">Händelselogg</a>
        </div>
        <LogoutButton />
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
