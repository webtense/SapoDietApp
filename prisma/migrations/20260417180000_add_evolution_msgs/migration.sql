-- CreateMigration
-- Migration name: add_evolution_msgs
-- Created at: 2026-04-17T18:00:00.000Z

BEGIN;

-- Create EvolutionMsg table
CREATE TABLE "EvolutionMsg" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'whatsapp',
    "direction" TEXT NOT NULL,
    "fromPhone" TEXT,
    "toPhone" TEXT,
    "content" TEXT NOT NULL,
    "rawJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvolutionMsg_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EvolutionMsg" ADD CONSTRAINT "EvolutionMsg_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "EvolutionMsg_userId_createdAt_idx" ON "EvolutionMsg"("userId", "createdAt");
CREATE INDEX "EvolutionMsg_platform_createdAt_idx" ON "EvolutionMsg"("platform", "createdAt");

COMMIT;
