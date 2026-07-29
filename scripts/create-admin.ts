// Skapar (eller uppdaterar lösenordet för) en admin-användare.
// Körs manuellt vid uppsättning — det finns medvetet ingen självregistrering
// av admins i UI:t, det vore en säkerhetsrisk för ett publikt event.
//
// Användning:
//   npx ts-node scripts/create-admin.ts admin@example.com "ettStarktLosenord"

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/admin-auth";

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Användning: npx ts-node scripts/create-admin.ts <email> "<lösenord>"');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Admin klar: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
