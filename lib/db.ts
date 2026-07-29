import { PrismaClient } from "@prisma/client";

// Standard Next.js-mönster: undvik att skapa flera Prisma-instanser vid hot-reload i dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
