import { createMiddleware } from "hono/factory";
import { getAuth } from "../lib/auth";

type AuthVariables = {
  user: { id: string; name: string; email: string };
  session: { id: string; userId: string };
};

export const authMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const session = await getAuth().api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});
