-- CreateTable
CREATE TABLE "HealthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "HealthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "steps" INTEGER,
    "activeKcal" DOUBLE PRECISION,
    "restingHr" INTEGER,
    "avgHr" INTEGER,
    "sleepMin" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthWorkout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "kcal" DOUBLE PRECISION,
    "avgHr" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthToken_tokenHash_key" ON "HealthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "HealthToken_userId_idx" ON "HealthToken"("userId");

-- CreateIndex
CREATE INDEX "HealthDaily_userId_date_idx" ON "HealthDaily"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HealthDaily_userId_date_key" ON "HealthDaily"("userId", "date");

-- CreateIndex
CREATE INDEX "HealthWorkout_userId_startedAt_idx" ON "HealthWorkout"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HealthWorkout_userId_source_externalId_key" ON "HealthWorkout"("userId", "source", "externalId");

-- AddForeignKey
ALTER TABLE "HealthToken" ADD CONSTRAINT "HealthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthDaily" ADD CONSTRAINT "HealthDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthWorkout" ADD CONSTRAINT "HealthWorkout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
