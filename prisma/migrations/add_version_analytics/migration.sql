-- CreateTable VersionAnalytics
CREATE TABLE "VersionAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "version" TEXT,
    "oldVersion" TEXT,
    "userId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable VersionHistory
CREATE TABLE "VersionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "commit" TEXT,
    "deployedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "usersOnVersion" INTEGER DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable FeatureFlag
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable ScheduledUpdate
CREATE TABLE "ScheduledUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "VersionAnalytics_version_idx" ON "VersionAnalytics"("version");
CREATE INDEX "VersionAnalytics_event_idx" ON "VersionAnalytics"("event");
CREATE INDEX "VersionHistory_version_idx" ON "VersionHistory"("version");
CREATE INDEX "FeatureFlag_name_idx" ON "FeatureFlag"("name");
