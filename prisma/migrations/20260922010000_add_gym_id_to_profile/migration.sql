-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "gymId" TEXT;

-- CreateIndex
CREATE INDEX "Profile_gymId_idx" ON "Profile"("gymId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
