import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Skyddas av middleware.ts (matchar denna path för alla metoder).

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get("gameId");
  if (!gameId) return NextResponse.json({ error: "gameId krävs" }, { status: 400 });
  const missions = await db.mission.findMany({ where: { gameId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(missions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.gameId || !body?.title) {
    return NextResponse.json({ error: "gameId och title krävs" }, { status: 400 });
  }
  const mission = await db.mission.create({
    data: {
      gameId: body.gameId,
      title: body.title,
      description: body.description,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
    },
  });
  return NextResponse.json(mission, { status: 201 });
}
