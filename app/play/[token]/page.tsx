import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verifyParticipantToken } from "@/lib/auth";
import PlayerView from "./PlayerView";

// Server component: verifierar token och hämtar startdata innan något renderas.
// Ogiltig/förfalskad token -> 404 (läcker inte information om varför).
export default async function PlayPage({ params }: { params: { token: string } }) {
  const payload = await verifyParticipantToken(params.token).catch(() => null);
  if (!payload) notFound();

  const participant = await db.participant.findUnique({
    where: { id: payload.participantId },
    include: { game: true },
  });
  if (!participant || participant.gameId !== payload.gameId) notFound();

  const [otherParticipants, weapons, missions, recentEvents] = await Promise.all([
    db.participant.findMany({
      where: { gameId: participant.gameId, status: "ALIVE", id: { not: participant.id } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.weapon.findMany({ where: { gameId: participant.gameId }, select: { name: true } }),
    db.mission.findMany({
      where: { gameId: participant.gameId },
      select: { id: true, title: true, description: true, status: true, latitude: true, longitude: true },
      orderBy: { createdAt: "asc" },
    }),
    db.gameEvent.findMany({
      where: { gameId: participant.gameId },
      include: { victim: true, killer: true, mission: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <PlayerView
      token={params.token}
      participant={{
        id: participant.id,
        name: participant.name,
        status: participant.status,
        gameId: participant.gameId,
        gameName: participant.game.name,
      }}
      otherParticipants={otherParticipants}
      weapons={weapons.map((w) => w.name)}
      missions={missions}
      initialEvents={JSON.parse(JSON.stringify(recentEvents))}
    />
  );
}
