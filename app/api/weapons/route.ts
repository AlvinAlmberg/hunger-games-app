import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Vapenlistan används av deltagarvyn för att fylla dropdownen vid självrapport.
export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get("gameId");
  if (!gameId) return NextResponse.json({ error: "gameId krävs" }, { status: 400 });
  const weapons = await db.weapon.findMany({ where: { gameId }, orderBy: { name: "asc" } });
  return NextResponse.json(weapons);
}

// Skyddas av middleware.ts (matchar denna path för alla metoder).
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.gameId || !body?.name) {
    return NextResponse.json({ error: "gameId och name krävs" }, { status: 400 });
  }
  const weapon = await db.weapon.create({ data: { gameId: body.gameId, name: body.name } });
  return NextResponse.json(weapon, { status: 201 });
}
