import type { Context, MiddlewareHandler } from "hono";

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
 * Simple in-memory rate limiter for the Bun server runtime.
 */
export function kvRateLimiter(options: KvRateLimitOptions): MiddlewareHandler {
  const { windowMs, limit, prefix, skipSuccessfulRequests } = options;

  return async (c, next) => {
    if (shouldSkipMethod(c)) {
      return next();
    }

    const clientKey = getClientKey(c);
    const bucket = windowBucket(Date.now(), windowMs);
    const key = memKey(prefix, clientKey, bucket);

    if (skipSuccessfulRequests) {
      const failures = memoryStore.get(key) ?? 0;
      if (failures >= limit) {
        return c.json({ error: "Too many requests" }, 429);
      }

      await next();

      if (responseStatus(c) < 400) return;

      memoryStore.set(key, failures + 1);
      return;
    }

    const count = memoryStore.get(key) ?? 0;
    if (count >= limit) {
      return c.json({ error: "Too many requests" }, 429);
    }
    memoryStore.set(key, count + 1);

    await next();
  };
}
