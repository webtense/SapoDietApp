-- CreateTable "VersionAnalytics"
CREATE TABLE "VersionAnalytics" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "version" TEXT,
    "oldVersion" TEXT,
    "userId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable "VersionHistory"
CREATE TABLE "VersionHistory" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "commit" TEXT,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable "FeatureFlag"
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable "ScheduledUpdate"
CREATE TABLE "ScheduledUpdate" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VersionAnalytics_event_idx" ON "VersionAnalytics"("event");
CREATE INDEX "VersionAnalytics_version_idx" ON "VersionAnalytics"("version");
CREATE INDEX "VersionAnalytics_createdAt_idx" ON "VersionAnalytics"("createdAt");
CREATE UNIQUE INDEX "VersionHistory_version_key" ON "VersionHistory"("version");
CREATE UNIQUE INDEX "FeatureFlag_name_key" ON "FeatureFlag"("name");
CREATE INDEX "ScheduledUpdate_status_scheduledFor_idx" ON "ScheduledUpdate"("status", "scheduledFor");
