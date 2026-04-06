import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../lib/runtime";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function normalizeEnvUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

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

function isPrismaAccelerateUrl(value: string | undefined): value is string {
  return Boolean(value?.startsWith("prisma://") || value?.startsWith("prisma+postgres://"));
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = normalizeEnvUrl(env("DATABASE_URL"));
  const directUrl = normalizeEnvUrl(env("DIRECT_URL"));
  const runtimeConnectionMode = env("PRISMA_RUNTIME_CONNECTION")?.toLowerCase();

  if (!databaseUrl && !directUrl) {
    throw new Error("DATABASE_URL or DIRECT_URL is required to start the backend.");
  }

  const hasAccelerateUrl = isPrismaAccelerateUrl(databaseUrl);
  const forceDirect = runtimeConnectionMode === "direct";
  const forceAccelerate = runtimeConnectionMode === "accelerate";
  const shouldPreferAccelerate =
    forceAccelerate || (!forceDirect && env("NODE_ENV") === "production" && hasAccelerateUrl);

  if (shouldPreferAccelerate && hasAccelerateUrl && databaseUrl) {
    console.log("[db] Using Prisma Accelerate via DATABASE_URL");
    return new PrismaClient({ accelerateUrl: databaseUrl });
  }

  if (directUrl) {
    console.log(`[db] Using direct Postgres via DIRECT_URL (${urlTargetLabel(directUrl)})`);
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: directUrl }),
    });
  }

  if (hasAccelerateUrl && databaseUrl) {
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

let moduleSingleton: PrismaClient | undefined;

function getPrismaInstance(): PrismaClient {
  if (moduleSingleton) return moduleSingleton;
  if (globalForPrisma.prisma) {
    moduleSingleton = globalForPrisma.prisma;
    return moduleSingleton;
  }
  moduleSingleton = createPrismaClient();
  if (env("NODE_ENV") !== "production") {
    globalForPrisma.prisma = moduleSingleton;
  }
  return moduleSingleton;
}

export function getPrisma(): PrismaClient {
  return getPrismaInstance();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const real = getPrismaInstance();
    return Reflect.get(real, prop, receiver === prisma ? real : receiver);
  },
});
