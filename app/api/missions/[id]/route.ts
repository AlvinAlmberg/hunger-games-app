import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EventType, MissionStatus } from "@prisma/client";

// Skyddas av middleware.ts (matchar /api/missions/:path* för alla metoder).

const STATUS_TO_EVENT: Partial<Record<MissionStatus, EventType>> = {
  ACTIVE: "SYSTEM",
  COMPLETED: "MISSION_COMPLETED",
  FAILED: "MISSION_FAILED",
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const before = await db.mission.findUnique({ where: { id: params.id } });
  if (!before) {
    return NextResponse.json({ error: "Uppdrag hittades inte" }, { status: 404 });
  }

  const mission = await db.mission.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
      ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
    },
  });

  // Statusändring -> logga ett event, så deltagarnas live-flöde och admins
  // händelselogg visar det ("events är källan till sanning").
  const statusChanged = body.status !== undefined && body.status !== before.status;
  if (statusChanged) {
    const eventType = STATUS_TO_EVENT[mission.status as MissionStatus];
    if (eventType) {
      await db.gameEvent.create({
        data: {
          gameId: mission.gameId,
          type: eventType,
          missionId: mission.id,
          note:
            mission.status === "ACTIVE"
              ? `Uppdraget "${mission.title}" har startat`
              : undefined,
        },
      });
    }
  }

  return NextResponse.json(mission);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.mission.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
