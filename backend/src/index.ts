import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { auth } from "./lib/auth";
import { config, isAllowedOrigin } from "./lib/config";
import teams from "./routes/teams";
import profiles from "./routes/profiles";

const app = new Hono();

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
      if (!origin) return config.primaryFrontendOrigin;
      if (isAllowedOrigin(origin)) return origin;

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[cors] blocked origin "${origin}". Allowed origins: ${config.frontendOrigins.join(", ")}`
        );
      }

      return "";
    },
    credentials: true,
  })
);

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

// Identifier sign-in proxy: same policy as Better Auth sign-in route.
app.use(
  "/api/profiles/login",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyGenerator: getClientKey,
    skip: shouldSkipRateLimit,
    skipSuccessfulRequests: true,
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
    skip: (c) => shouldSkipRateLimit(c) || c.req.path === "/api/profiles/login",
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/teams", teams);
app.route("/api/profiles", profiles);

app.onError((error, c) => {
  const url = new URL(c.req.url);
  console.error(`[api-error] ${c.req.method} ${url.pathname}`, error);

  if (process.env.NODE_ENV !== "production") {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ error: "Internal server error" }, 500);
});

app.get("/", (c) => {
  return c.text(`Poke Builder API running on port ${config.port}`);
});

export default {
  port: config.port,
  fetch: app.fetch,
};
