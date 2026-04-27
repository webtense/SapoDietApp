BEGIN;

ALTER TABLE "Reminder"
ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'CUSTOM',
ADD COLUMN "system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastSentAt" TIMESTAMP(3),
ADD COLUMN "lastError" TEXT;

CREATE INDEX IF NOT EXISTS "Reminder_userId_enabled_idx" ON "Reminder"("userId", "enabled");
CREATE INDEX IF NOT EXISTS "Reminder_kind_idx" ON "Reminder"("kind");

COMMIT;
