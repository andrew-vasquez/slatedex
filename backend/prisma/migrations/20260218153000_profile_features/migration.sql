-- Add optional username for profile slugs.
ALTER TABLE "user"
ADD COLUMN "username" TEXT;

-- Backfill existing users with a deterministic unique username.
UPDATE "user"
SET "username" = CONCAT(
  COALESCE(
    NULLIF(LOWER(SUBSTRING(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '', 'g') FROM 1 FOR 12)), ''),
    'trainer'
  ),
  '_',
  SUBSTRING("id" FROM 1 FOR 6)
)
WHERE "username" IS NULL;

CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

CREATE TABLE "profile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bio" TEXT NOT NULL DEFAULT '',
  "favoriteGameIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "favoritePokemonNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");

ALTER TABLE "profile"
ADD CONSTRAINT "profile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "profile_username_change" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fromUsername" TEXT,
  "toUsername" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "profile_username_change_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_username_change_userId_createdAt_idx"
ON "profile_username_change"("userId", "createdAt");

ALTER TABLE "profile_username_change"
ADD CONSTRAINT "profile_username_change_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
