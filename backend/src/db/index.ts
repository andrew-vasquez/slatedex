import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const accelerateUrl = process.env.DATABASE_URL;

if (!accelerateUrl) {
  throw new Error("DATABASE_URL is required to start the backend.");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ accelerateUrl });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
