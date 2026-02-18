import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { auth } from "./lib/auth";
import { config, isAllowedOrigin } from "./lib/config";
import teams from "./routes/teams";
import profiles from "./routes/profiles";

const app = new Hono();

const getClientKey = (c: { req: { header: (name: string) => string | undefined } }) =>
  c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return config.primaryFrontendOrigin;
      return isAllowedOrigin(origin) ? origin : "";
    },
    credentials: true,
  })
);

// Rate limiters — registered before route handlers, most specific first

// Sign-in: 5 attempts per 15 minutes
app.use(
  "/api/auth/sign-in/*",
  rateLimiter({ windowMs: 15 * 60 * 1000, limit: 5, keyGenerator: getClientKey })
);

// Sign-up: 3 attempts per hour
app.use(
  "/api/auth/sign-up/*",
  rateLimiter({ windowMs: 60 * 60 * 1000, limit: 3, keyGenerator: getClientKey })
);

// Team API: 60 requests per minute
app.use(
  "/api/teams/*",
  rateLimiter({ windowMs: 60 * 1000, limit: 60, keyGenerator: getClientKey })
);

// Profile API: 60 requests per minute
app.use(
  "/api/profiles/*",
  rateLimiter({ windowMs: 60 * 1000, limit: 60, keyGenerator: getClientKey })
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
