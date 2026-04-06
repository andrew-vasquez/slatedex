import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAuth } from "./lib/auth";
import { getConfig, isAllowedOrigin } from "./lib/config";
import { isProduction } from "./lib/runtime";
import { kvRateLimiter } from "./middleware/rateLimitKv";
import teams from "./routes/teams";
import profiles from "./routes/profiles";
import ai from "./routes/ai";
import admin from "./routes/admin";
import battle from "./routes/battle";

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

  if (isProduction()) {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      if (isAllowedOrigin(origin)) return origin;

      if (!isProduction()) {
        const cfg = getConfig();
        console.warn(
          `[cors] blocked origin "${origin}". Allowed origins: ${cfg.frontendOrigins.join(", ")}`
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

app.use(
  "/api/auth/sign-in/*",
  kvRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    prefix: "auth-sign-in",
    skipSuccessfulRequests: true,
  })
);

app.use(
  "/api/auth/sign-up/*",
  kvRateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 8,
    prefix: "auth-sign-up",
  })
);

app.use(
  "/api/teams/*",
  kvRateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    prefix: "teams",
  })
);

app.use(
  "/api/profiles/*",
  kvRateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    prefix: "profiles",
  })
);

app.use(
  "/api/ai/*",
  kvRateLimiter({
    windowMs: 10 * 60 * 1000,
    limit: 20,
    prefix: "ai",
  })
);

app.use(
  "/api/admin/*",
  kvRateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    prefix: "admin",
  })
);

app.use(
  "/api/battle/*",
  kvRateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    prefix: "battle",
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => getAuth().handler(c.req.raw));

app.route("/api/teams", teams);
app.route("/api/profiles", profiles);
app.route("/api/ai", ai);
app.route("/api/admin", admin);
app.route("/api/battle", battle);

app.onError((error, c) => {
  const url = new URL(c.req.url);
  console.error(`[api-error] ${c.req.method} ${url.pathname}`, error);

  applySecurityHeaders(c);

  if (!isProduction()) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ error: "Internal server error" }, 500);
});

app.get("/healthz", (c) => c.json({ ok: true }));

app.get("/", (c) => {
  const cfg = getConfig();
  return c.text(`Poke Builder API running on port ${cfg.port}`);
});

export { app };
