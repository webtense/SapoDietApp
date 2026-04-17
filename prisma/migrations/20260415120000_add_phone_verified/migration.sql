-- CreateMigration
-- Migration name: add_phone_verified
-- Created at: 2026-04-15T12:00:00.000Z

BEGIN;

ALTER TABLE "User" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

COMMIT;