-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "subscriptionstatus";

-- CreateTable
CREATE TABLE "WorkoutSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "group" TEXT NOT NULL,
    "label" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutSchedule_userId_idx" ON "WorkoutSchedule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSchedule_userId_weekday_key" ON "WorkoutSchedule"("userId", "weekday");

-- CreateIndex
CREATE INDEX "Gym_createdById_idx" ON "Gym"("createdById");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gym" ADD CONSTRAINT "Gym_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSchedule" ADD CONSTRAINT "WorkoutSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

