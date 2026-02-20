CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM_EVENT');
CREATE TYPE "AiMessageKind" AS ENUM ('CHAT', 'ANALYSIS');

CREATE TABLE "ai_conversation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "AiMessageRole" NOT NULL,
  "kind" "AiMessageKind" NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_conversation_userId_teamId_key"
ON "ai_conversation"("userId", "teamId");

CREATE INDEX "ai_conversation_userId_updatedAt_idx"
ON "ai_conversation"("userId", "updatedAt");

CREATE INDEX "ai_message_conversationId_createdAt_idx"
ON "ai_message"("conversationId", "createdAt");

ALTER TABLE "ai_conversation"
ADD CONSTRAINT "ai_conversation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_conversation"
ADD CONSTRAINT "ai_conversation_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_message"
ADD CONSTRAINT "ai_message_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "ai_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
