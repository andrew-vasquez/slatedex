import type { Context, MiddlewareHandler } from "hono";
import { getRateLimitKvFromBindings } from "../lib/runtime";

export type KvRateLimitOptions = {
  windowMs: number;
  limit: number;
  /** Distinct counter namespace (e.g. `auth-sign-in`). */
  prefix: string;
  /**
   * When true, only failed responses (status >= 400) increment the counter.
   */
  skipSuccessfulRequests?: boolean;
};

const memoryStore = new Map<string, number>();

function getClientKey(c: { req: { header: (name: string) => string | undefined } }): string {
  const forwardedFor = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp =
    c.req.header("cf-connecting-ip")?.trim() ||
    c.req.header("x-real-ip")?.trim() ||
    c.req.header("fly-client-ip")?.trim() ||
    forwardedFor;

  if (clientIp) return clientIp;

  const userAgent = c.req.header("user-agent")?.trim() || "unknown";
  return `unknown:${userAgent.slice(0, 160)}`;
}

function shouldSkipMethod(c: { req: { method: string } }): boolean {
  return c.req.method === "OPTIONS" || c.req.method === "HEAD";
}

function windowBucket(now: number, windowMs: number): number {
  return Math.floor(now / windowMs);
}

async function kvGetCount(
  kv: NonNullable<ReturnType<typeof getRateLimitKvFromBindings>>,
  key: string
): Promise<number> {
  const raw = await kv.get(key);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

async function kvSetCount(
  kv: NonNullable<ReturnType<typeof getRateLimitKvFromBindings>>,
  key: string,
  value: number,
  windowMs: number
): Promise<void> {
  await kv.put(key, String(value), {
    expirationTtl: Math.max(60, Math.ceil(windowMs / 1000) + 120),
  });
}

function memKey(prefix: string, clientKey: string, bucket: number): string {
  return `${prefix}:${clientKey}:${bucket}`;
}

function responseStatus(c: Context): number {
  try {
    return c.res.status;
  } catch {
    return 500;
  }
}

/**
 * Rate limiter backed by Cloudflare KV when `RATE_LIMIT_KV` is bound; otherwise in-memory (dev / Bun).
 */
export function kvRateLimiter(options: KvRateLimitOptions): MiddlewareHandler {
  const { windowMs, limit, prefix, skipSuccessfulRequests } = options;

  return async (c, next) => {
    if (shouldSkipMethod(c)) {
      return next();
    }

    const kv = getRateLimitKvFromBindings();
    const clientKey = getClientKey(c);
    const bucket = windowBucket(Date.now(), windowMs);
    const key = `rl:${prefix}:${clientKey}:${bucket}`;

    if (skipSuccessfulRequests) {
      if (kv) {
        const failures = await kvGetCount(kv, key);
        if (failures >= limit) {
          return c.json({ error: "Too many requests" }, 429);
        }
      } else {
        const mk = memKey(prefix, clientKey, bucket);
        const failures = memoryStore.get(mk) ?? 0;
        if (failures >= limit) {
          return c.json({ error: "Too many requests" }, 429);
        }
      }

      await next();

      if (responseStatus(c) < 400) return;

      if (kv) {
        const nextVal = (await kvGetCount(kv, key)) + 1;
        await kvSetCount(kv, key, nextVal, windowMs);
      } else {
        const mk = memKey(prefix, clientKey, bucket);
        memoryStore.set(mk, (memoryStore.get(mk) ?? 0) + 1);
      }
      return;
    }

    if (kv) {
      const count = await kvGetCount(kv, key);
      if (count >= limit) {
        return c.json({ error: "Too many requests" }, 429);
      }
      await kvSetCount(kv, key, count + 1, windowMs);
    } else {
      const mk = memKey(prefix, clientKey, bucket);
      const count = memoryStore.get(mk) ?? 0;
      if (count >= limit) {
        return c.json({ error: "Too many requests" }, 429);
      }
      memoryStore.set(mk, count + 1);
    }

    await next();
  };
}
