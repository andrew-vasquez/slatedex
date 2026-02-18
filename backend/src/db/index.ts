import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function normalizeEnvUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  // Railway/UI copy-paste commonly includes wrapping quotes.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function urlTargetLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const port = parsed.port || (parsed.protocol === "postgresql:" ? "5432" : "");
    return `${parsed.protocol}//${parsed.hostname}${port ? `:${port}` : ""}`;
  } catch {
    return "invalid-url";
  }
}

const databaseUrl = normalizeEnvUrl(process.env.DATABASE_URL);
const directUrl = normalizeEnvUrl(process.env.DIRECT_URL);
const runtimeConnectionMode = process.env.PRISMA_RUNTIME_CONNECTION?.trim().toLowerCase();

if (!databaseUrl && !directUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL is required to start the backend.");
}

function isPrismaAccelerateUrl(value: string | undefined): value is string {
  return Boolean(value?.startsWith("prisma://"));
}

function createPrismaClient(): PrismaClient {
  const hasAccelerateUrl = isPrismaAccelerateUrl(databaseUrl);
  const forceDirect = runtimeConnectionMode === "direct";
  const forceAccelerate = runtimeConnectionMode === "accelerate";
  const shouldPreferAccelerate =
    forceAccelerate || (!forceDirect && process.env.NODE_ENV === "production" && hasAccelerateUrl);

  if (shouldPreferAccelerate && hasAccelerateUrl) {
    console.log("[db] Using Prisma Accelerate via DATABASE_URL");
    return new PrismaClient({ accelerateUrl: databaseUrl });
  }

  // In non-production, prefer direct for strongest read-after-write consistency during local auth testing.
  if (directUrl) {
    console.log(`[db] Using direct Postgres via DIRECT_URL (${urlTargetLabel(directUrl)})`);
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: directUrl }),
    });
  }

  if (hasAccelerateUrl) {
    console.log("[db] Using Prisma Accelerate via DATABASE_URL");
    return new PrismaClient({ accelerateUrl: databaseUrl });
  }

  if (!databaseUrl) {
    throw new Error("No runtime database URL available.");
  }

  console.log(`[db] Using direct Postgres via DATABASE_URL (${urlTargetLabel(databaseUrl)})`);
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
