import { Hono } from "hono";
import { Prisma, UserPlan, UserRole } from "../generated/prisma/client";
import { prisma } from "../db";
import { readJsonBody } from "../lib/request";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/admin";

type AuthEnv = {
  Variables: {
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
};

type RangeKey = "30d" | "90d" | "12m";
type DayPoint = { day: string; value: number };

const admin = new Hono<AuthEnv>();
admin.use("*", authMiddleware);
admin.use("*", requireRole(UserRole.ADMIN));

const MAX_QUERY_LENGTH = 80;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;
const MAX_LIMIT_VALUE = 100_000;
const MAX_ADMIN_REQUEST_BODY_BYTES = 16_000;

function parseRange(raw: string | undefined): RangeKey {
  if (raw === "90d") return "90d";
  if (raw === "12m") return "12m";
  return "30d";
}

function getRangeStart(range: RangeKey): Date {
  const now = new Date();
  if (range === "12m") {
    return new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  }
  const days = range === "90d" ? 90 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function getCurrentPeriodStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function toBadge(role: UserRole, plan: UserPlan): "Owner" | "Admin" | "Pro" | null {
  if (role === UserRole.OWNER) return "Owner";
  if (role === UserRole.ADMIN) return "Admin";
  if (plan === UserPlan.PRO) return "Pro";
  return null;
}

function parsePageSize(raw: string | undefined): number {
  const value = raw ? Number(raw) : DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, value);
}

function parseSearchQuery(raw: string | undefined): string {
  if (!raw) return "";
  const query = raw.trim();
  if (!query) return "";
  return query.slice(0, MAX_QUERY_LENGTH);
}

function decodeCursor(raw: string | undefined): { updatedAt: Date; id: string } | null {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const [updatedAtIso, id] = decoded.split("|");
    if (!updatedAtIso || !id) return null;
    const updatedAt = new Date(updatedAtIso);
    if (Number.isNaN(updatedAt.getTime())) return null;
    return { updatedAt, id };
  } catch {
    return null;
  }
}

function encodeCursor(updatedAt: Date, id: string): string {
  return Buffer.from(`${updatedAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

function parsePlan(raw: unknown): UserPlan | null | "invalid" {
  if (raw === undefined) return null;
  if (typeof raw !== "string") return "invalid";
  const normalized = raw.trim().toUpperCase();
  if (normalized === UserPlan.FREE || normalized === UserPlan.PRO) {
    return normalized;
  }
  return "invalid";
}

function parseRole(raw: unknown): UserRole | null | "invalid" {
  if (raw === undefined) return null;
  if (typeof raw !== "string") return "invalid";
  const normalized = raw.trim().toUpperCase();
  if (normalized === UserRole.USER || normalized === UserRole.ADMIN || normalized === UserRole.OWNER) {
    return normalized;
  }
  return "invalid";
}

function parseLimit(raw: unknown): number | null | "invalid" {
  if (raw === undefined) return null;
  if (typeof raw !== "number" || !Number.isInteger(raw)) return "invalid";
  if (raw < 0 || raw > MAX_LIMIT_VALUE) return "invalid";
  return raw;
}

function parseBoolean(raw: unknown): boolean | null | "invalid" {
  if (raw === undefined) return null;
  if (typeof raw !== "boolean") return "invalid";
  return raw;
}

async function getDailyCountSeries(params: {
  tableName: "user" | "team";
  createdAfter: Date;
  aliases: { day: string; value: string };
}): Promise<DayPoint[]> {
  const { tableName, createdAfter, aliases } = params;
  const rows =
    tableName === "user"
      ? await prisma.$queryRaw<Array<{ day: Date; value: bigint }>>(
          Prisma.sql`
            SELECT
              DATE_TRUNC('day', "createdAt") AS "day",
              COUNT(*) AS "value"
            FROM "user"
            WHERE "createdAt" >= ${createdAfter}
            GROUP BY DATE_TRUNC('day', "createdAt")
            ORDER BY DATE_TRUNC('day', "createdAt") ASC
          `
        )
      : await prisma.$queryRaw<Array<{ day: Date; value: bigint }>>(
          Prisma.sql`
            SELECT
              DATE_TRUNC('day', "createdAt") AS "day",
              COUNT(*) AS "value"
            FROM "team"
            WHERE "createdAt" >= ${createdAfter}
            GROUP BY DATE_TRUNC('day', "createdAt")
            ORDER BY DATE_TRUNC('day', "createdAt") ASC
          `
        );

  return rows.map((row) => ({
    [aliases.day]: row.day.toISOString(),
    [aliases.value]: Number(row.value),
  })) as DayPoint[];
}

type AiMessageDailyRow = {
  day: Date;
  kind: "CHAT" | "ANALYSIS";
  value: bigint;
};

async function getDailyAiUsageSeries(createdAfter: Date): Promise<Array<{ day: string; chat: number; analyze: number }>> {
  const rows = await prisma.$queryRaw<AiMessageDailyRow[]>(
    Prisma.sql`
      SELECT
        DATE_TRUNC('day', "createdAt") AS "day",
        "kind" AS "kind",
        COUNT(*) AS "value"
      FROM "ai_message"
      WHERE "createdAt" >= ${createdAfter}
        AND "role" = 'USER'
        AND "kind" IN ('CHAT', 'ANALYSIS')
      GROUP BY DATE_TRUNC('day', "createdAt"), "kind"
      ORDER BY DATE_TRUNC('day', "createdAt") ASC
    `
  );

  const bucket = new Map<string, { day: string; chat: number; analyze: number }>();
  for (const row of rows) {
    const key = row.day.toISOString();
    const current = bucket.get(key) ?? { day: key, chat: 0, analyze: 0 };
    if (row.kind === "CHAT") current.chat = Number(row.value);
    if (row.kind === "ANALYSIS") current.analyze = Number(row.value);
    bucket.set(key, current);
  }
  return Array.from(bucket.values()).sort((a, b) => a.day.localeCompare(b.day));
}

admin.get("/overview", async (c) => {
  const range = parseRange(c.req.query("range"));
  const start = getRangeStart(range);
  const currentPeriodStart = getCurrentPeriodStart();
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersInRange,
    proUsers,
    adminUsers,
    totalTeams,
    totalChats,
    totalAnalyzes,
    totalAiActionsInRange,
    activeUsersRows,
    usersByPlan,
    usersByRole,
    usersAtQuotaCurrentMonth,
    dailyNewUsers,
    dailyNewTeams,
    dailyAiUsage,
    topUsersCurrentPeriod,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: start } } }),
    prisma.user.count({ where: { plan: UserPlan.PRO } }),
    prisma.user.count({ where: { role: { in: [UserRole.ADMIN, UserRole.OWNER] } } }),
    prisma.team.count(),
    prisma.aiMessage.count({
      where: { role: "USER", kind: "CHAT" },
    }),
    prisma.aiMessage.count({
      where: { role: "USER", kind: "ANALYSIS" },
    }),
    prisma.aiMessage.count({
      where: { role: "USER", createdAt: { gte: start } },
    }),
    prisma.aiConversation.findMany({
      where: { updatedAt: { gte: last30Days } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.user.groupBy({
      by: ["plan"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.$queryRaw<Array<{ count: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "ai_monthly_usage" u
        JOIN "user" usr ON usr."id" = u."userId"
        WHERE u."periodStart" = ${currentPeriodStart}
          AND (
            (NOT usr."unlimitedAiChat" AND u."chatCount" >= GREATEST(usr."monthlyChatLimit", 0))
            OR
            (NOT usr."unlimitedAiAnalyze" AND u."analyzeCount" >= GREATEST(usr."monthlyAnalyzeLimit", 0))
          )
      `
    ),
    getDailyCountSeries({
      tableName: "user",
      createdAfter: start,
      aliases: { day: "day", value: "value" },
    }),
    getDailyCountSeries({
      tableName: "team",
      createdAfter: start,
      aliases: { day: "day", value: "value" },
    }),
    getDailyAiUsageSeries(start),
    prisma.$queryRaw<
      Array<{
        userId: string;
        name: string;
        email: string;
        username: string | null;
        chatCount: number;
        analyzeCount: number;
      }>
    >(
      Prisma.sql`
        SELECT
          usr."id" AS "userId",
          usr."name" AS "name",
          usr."email" AS "email",
          usr."username" AS "username",
          u."chatCount" AS "chatCount",
          u."analyzeCount" AS "analyzeCount"
        FROM "ai_monthly_usage" u
        JOIN "user" usr ON usr."id" = u."userId"
        WHERE u."periodStart" = ${currentPeriodStart}
        ORDER BY (u."chatCount" + u."analyzeCount") DESC
        LIMIT 10
      `
    ),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
        plan: true,
        role: true,
      },
    }),
  ]);

  return c.json({
    range,
    period: {
      from: start.toISOString(),
      to: new Date().toISOString(),
    },
    kpis: {
      totalUsers,
      newUsersInRange,
      proUsers,
      adminUsers,
      totalTeams,
      totalChats,
      totalAnalyzes,
      totalAiActionsInRange,
      averageTeamsPerUser: totalUsers > 0 ? Number((totalTeams / totalUsers).toFixed(1)) : 0,
      activeUsersLast30d: activeUsersRows.length,
      usersAtQuotaCurrentMonth: Number(usersAtQuotaCurrentMonth[0]?.count ?? 0),
    },
    charts: {
      newUsersByDay: dailyNewUsers,
      newTeamsByDay: dailyNewTeams,
      aiUsageByDay: dailyAiUsage,
      usersByPlan: usersByPlan.map((entry) => ({
        key: entry.plan,
        value: entry._count._all,
      })),
      usersByRole: usersByRole.map((entry) => ({
        key: entry.role,
        value: entry._count._all,
      })),
    },
    topUsersThisMonth: topUsersCurrentPeriod.map((entry) => ({
      userId: entry.userId,
      name: entry.name,
      email: entry.email,
      username: entry.username,
      chatCount: entry.chatCount,
      analyzeCount: entry.analyzeCount,
      total: entry.chatCount + entry.analyzeCount,
    })),
    recentUsers: recentUsers.map((entry) => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      username: entry.username,
      createdAt: entry.createdAt.toISOString(),
      plan: entry.plan,
      role: entry.role,
    })),
  });
});

admin.get("/users", async (c) => {
  const limit = parsePageSize(c.req.query("limit"));
  const query = parseSearchQuery(c.req.query("query"));
  const cursor = decodeCursor(c.req.query("cursor"));
  const periodStart = getCurrentPeriodStart();

  const where: Prisma.UserWhereInput = {};
  if (query) {
    where.OR = [
      { email: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { username: { contains: query, mode: "insensitive" } },
    ];
  }
  if (cursor) {
    where.AND = [
      {
        OR: [
          { updatedAt: { lt: cursor.updatedAt } },
          {
            updatedAt: cursor.updatedAt,
            id: { lt: cursor.id },
          },
        ],
      },
    ];
  }

  const rows = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      plan: true,
      monthlyChatLimit: true,
      monthlyAnalyzeLimit: true,
      unlimitedAiChat: true,
      unlimitedAiAnalyze: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const userIds = page.map((row) => row.id);

  type TeamCountRow = { userId: string; _count: { _all: number } };
  type UsageRow = { userId: string; chatCount: number; analyzeCount: number };

  const [teamCounts, usageRows] = await Promise.all([
    userIds.length > 0
      ? prisma.team.groupBy({
          by: ["userId"],
          where: { userId: { in: userIds } },
          _count: { _all: true },
        })
      : Promise.resolve([] as TeamCountRow[]),
    userIds.length > 0
      ? prisma.aiMonthlyUsage.findMany({
          where: {
            userId: { in: userIds },
            periodStart,
          },
          select: {
            userId: true,
            chatCount: true,
            analyzeCount: true,
          },
        })
      : Promise.resolve([] as UsageRow[]),
  ]);

  const teamCountByUser = new Map<string, number>(
    teamCounts.map((entry): [string, number] => [entry.userId, entry._count._all])
  );
  const usageByUser = new Map<string, UsageRow>(
    usageRows.map((entry): [string, UsageRow] => [entry.userId, entry])
  );

  const items = page.map((user) => {
    const usage = usageByUser.get(user.id);
    const chatUsed = usage?.chatCount ?? 0;
    const analyzeUsed = usage?.analyzeCount ?? 0;
    const chatLimit = Math.max(0, user.monthlyChatLimit);
    const analyzeLimit = Math.max(0, user.monthlyAnalyzeLimit);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      plan: user.plan,
      badge: toBadge(user.role, user.plan),
      teamCount: teamCountByUser.get(user.id) ?? 0,
      entitlements: {
        monthlyChatLimit: chatLimit,
        monthlyAnalyzeLimit: analyzeLimit,
        unlimitedAiChat: user.unlimitedAiChat,
        unlimitedAiAnalyze: user.unlimitedAiAnalyze,
      },
      usage: {
        periodStart: periodStart.toISOString(),
        chat: {
          used: chatUsed,
          limit: user.unlimitedAiChat ? null : chatLimit,
          remaining: user.unlimitedAiChat ? null : Math.max(0, chatLimit - chatUsed),
          unlimited: user.unlimitedAiChat,
        },
        analyze: {
          used: analyzeUsed,
          limit: user.unlimitedAiAnalyze ? null : analyzeLimit,
          remaining: user.unlimitedAiAnalyze ? null : Math.max(0, analyzeLimit - analyzeUsed),
          unlimited: user.unlimitedAiAnalyze,
        },
      },
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  });

  const nextCursor = hasMore
    ? encodeCursor(page[page.length - 1]!.updatedAt, page[page.length - 1]!.id)
    : null;

  return c.json({
    items,
    nextCursor,
  });
});

admin.patch("/users/:id/entitlements", async (c) => {
  const userId = c.req.param("id");
  if (!userId) return c.json({ error: "User id is required." }, 400);

  const body = await readJsonBody(c.req.raw, MAX_ADMIN_REQUEST_BODY_BYTES);
  if (!body.ok) {
    return c.json({ error: body.error }, body.status);
  }
  if (!body.value || typeof body.value !== "object") {
    return c.json({ error: "Invalid request body." }, 400);
  }
  const payload = body.value as Record<string, unknown>;

  const plan = parsePlan(payload.plan);
  const monthlyChatLimit = parseLimit(payload.monthlyChatLimit);
  const monthlyAnalyzeLimit = parseLimit(payload.monthlyAnalyzeLimit);
  const unlimitedAiChat = parseBoolean(payload.unlimitedAiChat);
  const unlimitedAiAnalyze = parseBoolean(payload.unlimitedAiAnalyze);

  if (plan === "invalid") return c.json({ error: "plan is invalid." }, 400);
  if (monthlyChatLimit === "invalid") return c.json({ error: "monthlyChatLimit is invalid." }, 400);
  if (monthlyAnalyzeLimit === "invalid") return c.json({ error: "monthlyAnalyzeLimit is invalid." }, 400);
  if (unlimitedAiChat === "invalid") return c.json({ error: "unlimitedAiChat is invalid." }, 400);
  if (unlimitedAiAnalyze === "invalid") return c.json({ error: "unlimitedAiAnalyze is invalid." }, 400);

  const data: Prisma.UserUpdateInput = {};
  if (plan) data.plan = plan;
  if (monthlyChatLimit !== null) data.monthlyChatLimit = monthlyChatLimit;
  if (monthlyAnalyzeLimit !== null) data.monthlyAnalyzeLimit = monthlyAnalyzeLimit;
  if (unlimitedAiChat !== null) data.unlimitedAiChat = unlimitedAiChat;
  if (unlimitedAiAnalyze !== null) data.unlimitedAiAnalyze = unlimitedAiAnalyze;
  if (Object.keys(data).length === 0) {
    return c.json({ error: "No valid updates were provided." }, 400);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      role: true,
      plan: true,
      monthlyChatLimit: true,
      monthlyAnalyzeLimit: true,
      unlimitedAiChat: true,
      unlimitedAiAnalyze: true,
    },
  }).catch((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2025"
    ) {
      return null;
    }
    throw error;
  });

  if (!updated) return c.json({ error: "User not found." }, 404);
  return c.json({ success: true, user: updated });
});

admin.patch("/users/:id/role", async (c) => {
  const viewer = c.get("viewer");
  if (viewer.role !== UserRole.OWNER) {
    return c.json({ error: "Only owners can update user roles." }, 403);
  }

  const userId = c.req.param("id");
  if (!userId) return c.json({ error: "User id is required." }, 400);

  const body = await readJsonBody(c.req.raw, MAX_ADMIN_REQUEST_BODY_BYTES);
  if (!body.ok) {
    return c.json({ error: body.error }, body.status);
  }
  if (!body.value || typeof body.value !== "object") {
    return c.json({ error: "Invalid request body." }, 400);
  }
  const payload = body.value as Record<string, unknown>;
  const role = parseRole(payload.role);
  if (role === "invalid" || !role) {
    return c.json({ error: "role is invalid." }, 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });
  if (!target) return c.json({ error: "User not found." }, 404);

  if (target.role === UserRole.OWNER && role !== UserRole.OWNER) {
    const otherOwners = await prisma.user.count({
      where: {
        role: UserRole.OWNER,
        id: { not: target.id },
      },
    });
    if (otherOwners < 1) {
      return c.json(
        { error: "Cannot remove the last owner. Assign another owner first." },
        409
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role },
    select: {
      id: true,
      role: true,
    },
  });

  return c.json({ success: true, user: updated });
});

admin.delete("/users/:id", async (c) => {
  const viewer = c.get("viewer");
  const userId = c.req.param("id");
  if (!userId) return c.json({ error: "User id is required." }, 400);

  if (viewer.id === userId) {
    return c.json({ error: "You cannot delete your own account from the admin dashboard." }, 409);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!target) return c.json({ error: "User not found." }, 404);

  if (target.role === UserRole.ADMIN && viewer.role !== UserRole.OWNER) {
    return c.json({ error: "Only owners can delete admin accounts." }, 403);
  }

  if (target.role === UserRole.OWNER) {
    if (viewer.role !== UserRole.OWNER) {
      return c.json({ error: "Only owners can delete owner accounts." }, 403);
    }

    const otherOwners = await prisma.user.count({
      where: {
        role: UserRole.OWNER,
        id: { not: target.id },
      },
    });
    if (otherOwners < 1) {
      return c.json({ error: "Cannot delete the last owner. Assign another owner first." }, 409);
    }
  }

  await prisma.user.delete({ where: { id: target.id } });
  return c.json({ success: true, deletedUserId: target.id });
});

export default admin;
