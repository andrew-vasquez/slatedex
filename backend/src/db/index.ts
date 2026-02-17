import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const accelerateUrl = process.env.DATABASE_URL?.trim();

if (!accelerateUrl) {
  throw new Error("DATABASE_URL is required to start the backend.");
}

if (!accelerateUrl.startsWith("prisma://")) {
  throw new Error(
    "DATABASE_URL must be a Prisma Accelerate URL (prisma://...). " +
      "If you are using a direct Postgres URL, switch this backend to a Prisma driver adapter."
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ accelerateUrl });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
