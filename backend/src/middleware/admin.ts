import { createMiddleware } from "hono/factory";
import { type UserRole } from "../generated/prisma/client";
import { prisma } from "../db";

type AdminVariables = {
  user: { id: string; name: string; email: string };
  session: { id: string; userId: string };
  viewer: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    role: UserRole;
  };
};

const ROLE_RANK: Record<UserRole, number> = {
  USER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function requireRole(minimumRole: UserRole) {
  return createMiddleware<{ Variables: AdminVariables }>(async (c, next) => {
    const sessionUser = c.get("user");
    const viewer = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
      },
    });

    if (!viewer) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if ((ROLE_RANK[viewer.role] ?? 0) < (ROLE_RANK[minimumRole] ?? 0)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    c.set("viewer", viewer);
    await next();
  });
}

