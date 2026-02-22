CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'OWNER');
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PRO');

ALTER TABLE "user"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN "monthlyChatLimit" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "monthlyAnalyzeLimit" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "unlimitedAiChat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "unlimitedAiAnalyze" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ai_monthly_usage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "chatCount" INTEGER NOT NULL DEFAULT 0,
  "analyzeCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_monthly_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_monthly_usage_userId_periodStart_key"
ON "ai_monthly_usage"("userId", "periodStart");

CREATE INDEX "ai_monthly_usage_periodStart_idx"
ON "ai_monthly_usage"("periodStart");

CREATE INDEX "ai_monthly_usage_userId_updatedAt_idx"
ON "ai_monthly_usage"("userId", "updatedAt");

ALTER TABLE "ai_monthly_usage"
ADD CONSTRAINT "ai_monthly_usage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
