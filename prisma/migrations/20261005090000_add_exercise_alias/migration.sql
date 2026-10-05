-- CreateTable: alias personal de usuario para una máquina de gimnasio física (GymMachine)
CREATE TABLE "ExerciseAlias" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymMachineId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseAlias_userId_gymMachineId_key" ON "ExerciseAlias"("userId", "gymMachineId");

-- AddForeignKey
ALTER TABLE "ExerciseAlias" ADD CONSTRAINT "ExerciseAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAlias" ADD CONSTRAINT "ExerciseAlias_gymMachineId_fkey" FOREIGN KEY ("gymMachineId") REFERENCES "GymMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
