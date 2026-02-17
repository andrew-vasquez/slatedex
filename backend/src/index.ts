import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import teams from "./routes/teams";

const app = new Hono();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
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
