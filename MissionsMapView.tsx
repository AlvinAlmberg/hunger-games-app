import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyParticipantToken } from "@/lib/auth";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";

// GET /api/events?gameId=...&since=<ISO-timestamp>
// Deltagarvyn och adminpanelen pollar detta endpoint var 3–5:e sekund.
// `since` gör att klienten bara hämtar nya events (billigare än att hämta allt varje gång).
export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get("gameId");
  const since = req.nextUrl.searchParams.get("since");
  if (!gameId) {
    return NextResponse.json({ error: "gameId krävs" }, { status: 400 });
  }

  const events = await db.gameEvent.findMany({
    where: {
      gameId,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    include: { victim: true, killer: true, mission: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(events);
}

// POST /api/events — skapar ett kill-event.
// Två flöden, styrda av `reportedVia`:
//   - "self":  en autentiserad deltagare (via QR-token) rapporterar sin egen död
//   - "admin": en admin registrerar det åt deltagaren
// I båda fallen: victimId sätts, participants.status uppdateras till DEAD atomärt
// tillsammans med event-loggen (transaktion), så de aldrig kan hamna ur synk.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gameId, victimId, killerId, weapon, reportedVia, participantToken } = body;

  if (!gameId || !victimId || !killerId || !weapon || !reportedVia) {
    return NextResponse.json(
      { error: "gameId, victimId, killerId, weapon och reportedVia krävs" },
      { status: 400 }
    );
  }

  let reportedBy: string;

  if (reportedVia === "self") {
    // Självrapport: verifiera att token faktiskt tillhör offret (victimId).
    // Detta stoppar en deltagare från att rapportera NÅGON ANNAN som död.
    if (!participantToken) {
      return NextResponse.json({ error: "participantToken krävs för självrapport" }, { status: 400 });
    }
    const payload = await verifyParticipantToken(participantToken).catch(() => null);
    if (!payload || payload.participantId !== victimId || payload.gameId !== gameId) {
      return NextResponse.json({ error: "Ogiltig eller ej matchande token" }, { status: 403 });
    }
    reportedBy = victimId;
  } else if (reportedVia === "admin") {
    // Admin-flödet är INTE skyddat av middleware (matchern täcker bara /api/events/:id),
    // eftersom denna route även måste vara nåbar för deltagares självrapporter.
    // Verifiera därför admin-sessionen explicit här innan vi litar på anropet.
    const sessionToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = sessionToken ? await verifyAdminSession(sessionToken).catch(() => null) : null;
    if (!session) {
      return NextResponse.json({ error: "Ej inloggad som admin" }, { status: 401 });
    }
    reportedBy = session.adminId;
  } else {
    return NextResponse.json({ error: "reportedVia måste vara 'self' eller 'admin'" }, { status: 400 });
  }

  const [event] = await db.$transaction([
    db.gameEvent.create({
      data: {
        gameId,
        type: "KILL",
        victimId,
        killerId,
        weapon,
        reportedVia,
        reportedBy,
      },
    }),
    db.participant.update({
      where: { id: victimId },
      data: { status: "DEAD" },
    }),
  ]);

  return NextResponse.json(event, { status: 201 });
}
