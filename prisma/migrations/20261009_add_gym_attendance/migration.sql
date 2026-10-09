-- CreateTable
CREATE TABLE "GymAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "gym" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymAttendance_userId_date_idx" ON "GymAttendance"("userId", "date");

-- CreateIndex
CREATE INDEX "GymAttendance_userId_createdAt_idx" ON "GymAttendance"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GymAttendance" ADD CONSTRAINT "GymAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
