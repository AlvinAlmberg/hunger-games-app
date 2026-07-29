// Valfri seed-fil för lokal utveckling: skapar ett testspel med ett par deltagare.
// Kör med: npm run seed
import { PrismaClient } from "@prisma/client";
import { DEFAULT_WEAPONS } from "../lib/weapons-seed";
import { hashPassword } from "../lib/admin-auth";

const prisma = new PrismaClient();

async function main() {
  // Test-admin för lokal utveckling. BYT LÖSENORD (eller kör npm run create-admin
  // med ett riktigt lösenord) innan detta någonsin körs mot en skarp databas.
  await prisma.adminUser.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: await hashPassword("changeme123"),
    },
  });

  const game = await prisma.game.create({
    data: {
      name: "Testspel (lokal utveckling)",
      weapons: { create: DEFAULT_WEAPONS.map((name) => ({ name })) },
    },
  });

  await prisma.participant.createMany({
    data: [
      { gameId: game.id, name: "Alice", qrToken: "seed-alice" },
      { gameId: game.id, name: "Bob", qrToken: "seed-bob" },
    ],
  });

  console.log(`Seedat: ${game.name} (${game.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
