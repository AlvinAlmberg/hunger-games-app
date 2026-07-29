import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const weapon = await db.weapon.update({
    where: { id: params.id },
    data: { name: body.name },
  });
  return NextResponse.json(weapon);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.weapon.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
