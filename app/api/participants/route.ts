import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signParticipantToken } from "@/lib/auth";

// GET /api/participants?gameId=... — lista deltagare i ett spel (admin-vy)
export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get("gameId");
  if (!gameId) {
    return NextResponse.json({ error: "gameId krävs" }, { status: 400 });
  }

  const participants = await db.participant.findMany({
    where: { gameId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(participants);
}

// POST /api/participants — skapa en deltagare i ett spel.
// Genererar en signerad QR-token (JWT) och returnerar den fulla /play/-länken
// som admin kan omvandla till en QR-kod i UI:t.
// Skyddas av middleware.ts (matchar denna path för alla metoder).
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.gameId || !body?.name) {
    return NextResponse.json({ error: "gameId och name krävs" }, { status: 400 });
  }

  // Deltagaren skapas först utan token, sedan signerar vi tokenet med det
  // riktiga participantId:t inbakat — så tokenet går aldrig att förfalska.
  const participant = await db.participant.create({
    data: { gameId: body.gameId, name: body.name, qrToken: "" },
  });

  const token = await signParticipantToken(participant.id, body.gameId);
  const updated = await db.participant.update({
    where: { id: participant.id },
    data: { qrToken: token },
  });

  return NextResponse.json(
    { ...updated, playUrl: `/play/${token}` },
    { status: 201 }
  );
}
