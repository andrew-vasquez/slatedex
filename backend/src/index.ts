import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { auth } from "./lib/auth";
import teams from "./routes/teams";

const app = new Hono();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const getClientKey = (c: { req: { header: (name: string) => string | undefined } }) =>
  c.req.header("x-forwarded-for") ?? "unknown";

app.use(
  "*",
  cors({
    origin: FRONTEND_URL,
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

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/teams", teams);

app.get("/", (c) => {
  return c.text(`Poke Builder API running on port ${PORT}`);
});

export default {
  port: PORT,
  fetch: app.fetch,
};
