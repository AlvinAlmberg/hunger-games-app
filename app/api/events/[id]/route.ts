import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Skyddas av middleware.ts (matchar /api/events/:id). Vid det laget är
// x-admin-id/x-admin-email redan verifierade och satta av middlewaren.

// PATCH /api/events/:id — admin korrigerar ett kill-event (fel mördare/vapen angivet).
// Sätter editedAt/editedBy för full spårbarhet i händelseloggen.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { killerId, weapon } = body;
  const adminId = req.headers.get("x-admin-id") ?? "unknown-admin";

  const event = await db.gameEvent.update({
    where: { id: params.id },
    data: {
      ...(killerId ? { killerId } : {}),
      ...(weapon ? { weapon } : {}),
      editedAt: new Date(),
      editedBy: adminId,
    },
  });

  return NextResponse.json(event);
}

// DELETE /api/events/:id — admin ångrar ett kill-event helt.
// Återupplivar deltagaren (status -> ALIVE) och loggar ett KILL_REVERTED-event
// istället för att bara radera raden, så historiken förblir granskningsbar.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const original = await db.gameEvent.findUnique({ where: { id: params.id } });
  if (!original || original.type !== "KILL" || !original.victimId) {
    return NextResponse.json({ error: "Kill-event hittades inte" }, { status: 404 });
  }

  const adminId = req.headers.get("x-admin-id") ?? "unknown-admin";

  const [, , revertEvent] = await db.$transaction([
    db.gameEvent.update({
      where: { id: params.id },
      data: { editedAt: new Date(), editedBy: adminId },
    }),
    db.participant.update({
      where: { id: original.victimId },
      data: { status: "ALIVE" },
    }),
    db.gameEvent.create({
      data: {
        gameId: original.gameId,
        type: "KILL_REVERTED",
        victimId: original.victimId,
        note: `Ångrade kill-event ${original.id} (av ${adminId})`,
      },
    }),
  ]);

  return NextResponse.json(revertEvent);
}
