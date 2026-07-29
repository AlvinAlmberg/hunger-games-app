import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_WEAPONS } from "@/lib/weapons-seed";

// GET /api/games — lista alla spel (admin-vy: väljare mellan HG 2026, HG 2027, ...)
export async function GET() {
  const games = await db.game.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true } } },
  });
  return NextResponse.json(games);
}

// POST /api/games — skapa ett nytt spel. Seedar automatiskt standardvapenlistan
// så admin har något att utgå från, men kan redigera fritt efteråt.
// Skyddas av middleware.ts (matchar denna path för alla metoder).
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name) {
    return NextResponse.json({ error: "name krävs" }, { status: 400 });
  }

  const game = await db.game.create({
    data: {
      name: body.name,
      weapons: { create: DEFAULT_WEAPONS.map((name: string) => ({ name })) },
    },
  });

  return NextResponse.json(game, { status: 201 });
}
