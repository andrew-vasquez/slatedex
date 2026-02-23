-- CreateEnum
CREATE TYPE "OpponentTeamSource" AS ENUM ('MANUAL', 'PRESET');

-- CreateTable
CREATE TABLE "opponent_team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "selectedVersionId" TEXT,
    "source" "OpponentTeamSource" NOT NULL DEFAULT 'MANUAL',
    "presetBossKey" TEXT,
    "pokemon" JSONB NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opponent_team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opponent_team_userId_idx" ON "opponent_team"("userId");

-- CreateIndex
CREATE INDEX "opponent_team_userId_generation_gameId_idx" ON "opponent_team"("userId", "generation", "gameId");

-- AddForeignKey
ALTER TABLE "opponent_team" ADD CONSTRAINT "opponent_team_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
