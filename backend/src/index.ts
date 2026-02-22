import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { auth } from "./lib/auth";
import { config, isAllowedOrigin } from "./lib/config";
import { shutdownPostHog } from "./lib/posthog";
import teams from "./routes/teams";
import profiles from "./routes/profiles";
import ai from "./routes/ai";
import admin from "./routes/admin";

const app = new Hono();
const API_CSP = "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";

function applySecurityHeaders(c: {
  header: (name: string, value: string) => void;
}) {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  c.header("Content-Security-Policy", API_CSP);

  if (process.env.NODE_ENV === "production") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

const getClientKey = (c: { req: { header: (name: string) => string | undefined } }) => {
  const forwardedFor = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp =
    c.req.header("cf-connecting-ip")?.trim() ||
    c.req.header("x-real-ip")?.trim() ||
    c.req.header("fly-client-ip")?.trim() ||
    forwardedFor;

  if (clientIp) return clientIp;

  // Last resort fallback to reduce global lockouts if proxy IP headers are missing.
  const userAgent = c.req.header("user-agent")?.trim() || "unknown";
  return `unknown:${userAgent.slice(0, 160)}`;
};

const shouldSkipRateLimit = (c: { req: { method: string } }) =>
  c.req.method === "OPTIONS" || c.req.method === "HEAD";

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      if (isAllowedOrigin(origin)) return origin;

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[cors] blocked origin "${origin}". Allowed origins: ${config.frontendOrigins.join(", ")}`
        );
      }

      return undefined;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    maxAge: 600,
  })
);

app.use("*", async (c, next) => {
  await next();
  applySecurityHeaders(c);
});

// Rate limiters — registered before route handlers, most specific first

// Sign-in: allow moderate retries while still throttling brute-force attempts.
app.use(
  "/api/auth/sign-in/*",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyGenerator: getClientKey,
    skip: shouldSkipRateLimit,
    skipSuccessfulRequests: true,
  })
);

// Sign-up: stricter than sign-in, but not too low for normal user retries.
app.use(
  "/api/auth/sign-up/*",
  rateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 8,
    keyGenerator: getClientKey,
    skip: shouldSkipRateLimit,
  })
);

// Team API: 60 requests per minute
app.use(
  "/api/teams/*",
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: getClientKey,
    skip: shouldSkipRateLimit,
  })
);

// Profile API: 60 requests per minute
app.use(
  "/api/profiles/*",
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: getClientKey,
    skip: shouldSkipRateLimit,
  })
);

// AI API: tighter limits due model cost.
app.use(
  "/api/ai/*",
  rateLimiter({
    windowMs: 10 * 60 * 1000,
    limit: 20,
    keyGenerator: getClientKey,
    skip: shouldSkipRateLimit,
  })
);

// Admin API: restricted route, low-volume but sensitive.
app.use(
  "/api/admin/*",
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: getClientKey,
    skip: shouldSkipRateLimit,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/teams", teams);
app.route("/api/profiles", profiles);
app.route("/api/ai", ai);
app.route("/api/admin", admin);

app.onError((error, c) => {
  const url = new URL(c.req.url);
  console.error(`[api-error] ${c.req.method} ${url.pathname}`, error);

  applySecurityHeaders(c);

  if (process.env.NODE_ENV !== "production") {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ error: "Internal server error" }, 500);
});

app.get("/", (c) => {
  return c.text(`Poke Builder API running on port ${config.port}`);
});

const SERVER_SYMBOL = Symbol.for("poke-builder.server");
const SHUTDOWN_HANDLER_SYMBOL = Symbol.for("poke-builder.shutdown-handler");
const SHUTTING_DOWN_SYMBOL = Symbol.for("poke-builder.shutting-down");
type BunServer = ReturnType<typeof Bun.serve>;
type ShutdownHandler = (signal: "SIGINT" | "SIGTERM") => void;
type GlobalWithServer = typeof globalThis & {
  [SERVER_SYMBOL]?: BunServer;
  [SHUTDOWN_HANDLER_SYMBOL]?: ShutdownHandler;
  [SHUTTING_DOWN_SYMBOL]?: boolean;
};
const globalWithServer = globalThis as GlobalWithServer;

if (globalWithServer[SERVER_SYMBOL]) {
  globalWithServer[SERVER_SYMBOL]?.stop(true);
}
if (globalWithServer[SHUTDOWN_HANDLER_SYMBOL]) {
  process.off("SIGINT", globalWithServer[SHUTDOWN_HANDLER_SYMBOL]);
  process.off("SIGTERM", globalWithServer[SHUTDOWN_HANDLER_SYMBOL]);
}

const server = Bun.serve({
  port: config.port,
  fetch: app.fetch,
});
globalWithServer[SERVER_SYMBOL] = server;
globalWithServer[SHUTTING_DOWN_SYMBOL] = false;

const handleShutdown: ShutdownHandler = (signal) => {
  if (globalWithServer[SHUTTING_DOWN_SYMBOL]) return;
  globalWithServer[SHUTTING_DOWN_SYMBOL] = true;
  console.debug(`[server] shutting down (${signal})`);

  void (async () => {
    try {
      await shutdownPostHog();
    } catch (error) {
      console.error("[posthog] shutdown error", error);
    }

    try {
      server.stop(true);
    } catch (error) {
      console.error("[server] stop error", error);
    }

    if (globalWithServer[SERVER_SYMBOL] === server) {
      delete globalWithServer[SERVER_SYMBOL];
    }
    delete globalWithServer[SHUTTING_DOWN_SYMBOL];
    process.exit(0);
  })();
};

globalWithServer[SHUTDOWN_HANDLER_SYMBOL] = handleShutdown;
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
console.debug(`Started server: ${server.url}`);

export { app };
