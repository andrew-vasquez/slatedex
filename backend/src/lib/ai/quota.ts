import { Prisma, type UserPlan } from "../../generated/prisma/client";
import { prisma } from "../../db";

export type AiUsageAction = "chat" | "analyze";

export type ActionUsageSummary = {
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
};

export type CurrentAiUsageSnapshot = {
  periodStart: string;
  resetsAt: string;
  plan: UserPlan;
  chat: ActionUsageSummary;
  analyze: ActionUsageSummary;
};

type UserQuotaState = {
  plan: UserPlan;
  monthlyChatLimit: number;
  monthlyAnalyzeLimit: number;
  unlimitedAiChat: boolean;
  unlimitedAiAnalyze: boolean;
};

const MAX_SERIALIZATION_RETRIES = 3;

function getCurrentPeriodStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function getNextPeriodStart(periodStart: Date): Date {
  return new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

function toSafeLimit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function buildActionSummary(params: {
  used: number;
  limit: number;
  unlimited: boolean;
}): ActionUsageSummary {
  const used = Math.max(0, params.used);
  if (params.unlimited) {
    return {
      used,
      limit: null,
      remaining: null,
      unlimited: true,
    };
  }

  const limit = toSafeLimit(params.limit);
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    unlimited: false,
  };
}

function buildUsageSnapshot(params: {
  periodStart: Date;
  plan: UserPlan;
  chatUsed: number;
  analyzeUsed: number;
  quota: UserQuotaState;
}): CurrentAiUsageSnapshot {
  const { periodStart, plan, chatUsed, analyzeUsed, quota } = params;
  return {
    periodStart: periodStart.toISOString(),
    resetsAt: getNextPeriodStart(periodStart).toISOString(),
    plan,
    chat: buildActionSummary({
      used: chatUsed,
      limit: quota.monthlyChatLimit,
      unlimited: quota.unlimitedAiChat,
    }),
    analyze: buildActionSummary({
      used: analyzeUsed,
      limit: quota.monthlyAnalyzeLimit,
      unlimited: quota.unlimitedAiAnalyze,
    }),
  };
}

function isSerializationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  );
}

async function loadUsageSnapshotForPeriod(params: {
  userId: string;
  periodStart: Date;
}): Promise<CurrentAiUsageSnapshot | null> {
  const { userId, periodStart } = params;
  const [user, usage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        monthlyChatLimit: true,
        monthlyAnalyzeLimit: true,
        unlimitedAiChat: true,
        unlimitedAiAnalyze: true,
      },
    }),
    prisma.aiMonthlyUsage.findUnique({
      where: {
        userId_periodStart: { userId, periodStart },
      },
      select: {
        chatCount: true,
        analyzeCount: true,
      },
    }),
  ]);

  if (!user) return null;

  return buildUsageSnapshot({
    periodStart,
    plan: user.plan,
    chatUsed: usage?.chatCount ?? 0,
    analyzeUsed: usage?.analyzeCount ?? 0,
    quota: {
      plan: user.plan,
      monthlyChatLimit: user.monthlyChatLimit,
      monthlyAnalyzeLimit: user.monthlyAnalyzeLimit,
      unlimitedAiChat: user.unlimitedAiChat,
      unlimitedAiAnalyze: user.unlimitedAiAnalyze,
    },
  });
}

export async function getCurrentUsageSnapshot(userId: string): Promise<CurrentAiUsageSnapshot | null> {
  const periodStart = getCurrentPeriodStart();
  return loadUsageSnapshotForPeriod({ userId, periodStart });
}

export async function reserveUsage(params: {
  userId: string;
  action: AiUsageAction;
}): Promise<
  | {
      allowed: true;
      periodStart: Date;
      snapshot: CurrentAiUsageSnapshot;
    }
  | {
      allowed: false;
      periodStart: Date;
      snapshot: CurrentAiUsageSnapshot;
    }
> {
  const { userId, action } = params;
  const periodStart = getCurrentPeriodStart();

  for (let attempt = 0; attempt < MAX_SERIALIZATION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              plan: true,
              monthlyChatLimit: true,
              monthlyAnalyzeLimit: true,
              unlimitedAiChat: true,
              unlimitedAiAnalyze: true,
            },
          });
          if (!user) {
            throw new Error("Unauthorized");
          }

          const usage = await tx.aiMonthlyUsage.upsert({
            where: {
              userId_periodStart: { userId, periodStart },
            },
            create: {
              userId,
              periodStart,
            },
            update: {},
            select: {
              id: true,
              chatCount: true,
              analyzeCount: true,
            },
          });

          const quota: UserQuotaState = {
            plan: user.plan,
            monthlyChatLimit: user.monthlyChatLimit,
            monthlyAnalyzeLimit: user.monthlyAnalyzeLimit,
            unlimitedAiChat: user.unlimitedAiChat,
            unlimitedAiAnalyze: user.unlimitedAiAnalyze,
          };

          const currentUsed = action === "chat" ? usage.chatCount : usage.analyzeCount;
          const limit = action === "chat" ? toSafeLimit(quota.monthlyChatLimit) : toSafeLimit(quota.monthlyAnalyzeLimit);
          const unlimited = action === "chat" ? quota.unlimitedAiChat : quota.unlimitedAiAnalyze;
          if (!unlimited && currentUsed >= limit) {
            return {
              allowed: false as const,
              periodStart,
              snapshot: buildUsageSnapshot({
                periodStart,
                plan: user.plan,
                chatUsed: usage.chatCount,
                analyzeUsed: usage.analyzeCount,
                quota,
              }),
            };
          }

          const updated = await tx.aiMonthlyUsage.update({
            where: { id: usage.id },
            data:
              action === "chat"
                ? { chatCount: { increment: 1 } }
                : { analyzeCount: { increment: 1 } },
            select: {
              chatCount: true,
              analyzeCount: true,
            },
          });

          return {
            allowed: true as const,
            periodStart,
            snapshot: buildUsageSnapshot({
              periodStart,
              plan: user.plan,
              chatUsed: updated.chatCount,
              analyzeUsed: updated.analyzeCount,
              quota,
            }),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (isSerializationError(error) && attempt + 1 < MAX_SERIALIZATION_RETRIES) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to reserve AI quota");
}

export async function releaseUsageReservation(params: {
  userId: string;
  action: AiUsageAction;
  periodStart: Date;
}): Promise<void> {
  const { userId, action, periodStart } = params;
  await prisma.aiMonthlyUsage.updateMany({
    where: {
      userId,
      periodStart,
      ...(action === "chat"
        ? { chatCount: { gt: 0 } }
        : { analyzeCount: { gt: 0 } }),
    },
    data:
      action === "chat"
        ? { chatCount: { decrement: 1 } }
        : { analyzeCount: { decrement: 1 } },
  });
}

