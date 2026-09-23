
-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('kg', 'lb');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('PLANNED', 'FREE');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('NOT_STARTED', 'COMPLETED', 'PARTIAL', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BodyPhotoPose" AS ENUM ('FRONT', 'SIDE', 'BACK');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('ENTRENAMIENTOS_SEMANA', 'RACHA_DIAS', 'VOLUMEN_TOTAL', 'MINUTOS_ACTIVOS');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('ACTIVO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('PRIMER_ENTRENAMIENTO', 'RACHA_7_DIAS', 'RACHA_30_DIAS', 'RETO_COMPLETADO', 'PESO_OBJETIVO_ALCANZADO');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupTrigger" AS ENUM ('MANUAL', 'CRON');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "gyms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muscle_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroupId" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "fabricantPhoto" TEXT,
    "primaryMuscleGroupId" TEXT NOT NULL,
    "secondaryMuscleGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "movementType" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_machines" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "machineModelId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assetNumber" TEXT,
    "notes" TEXT,
    "internalQRCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_weight_options" (
    "id" TEXT NOT NULL,
    "gymMachineId" TEXT NOT NULL,
    "unit" "WeightUnit" NOT NULL DEFAULT 'kg',
    "availableWeights" DOUBLE PRECISION[],
    "weightIncrement" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_weight_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_alternatives" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "alternativeExerciseId" TEXT NOT NULL,
    "muscleGroupRelevance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_alternatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "planType" "PlanType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutPlanId" TEXT,
    "sessionType" "SessionType" NOT NULL,
    "plannedPlanType" "PlanType",
    "completionStatus" "CompletionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "gymMachineId" TEXT,
    "plannedSets" INTEGER NOT NULL,
    "plannedReps" INTEGER NOT NULL,
    "plannedWeight" DOUBLE PRECISION,
    "estimatedDuration" INTEGER,
    "notes" TEXT,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "workoutExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "reps" INTEGER,
    "rir" INTEGER,
    "rpe" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "fatPercentage" DOUBLE PRECISION,
    "muscleMassKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "waistCm" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "hipsCm" DOUBLE PRECISION,
    "leftArmCm" DOUBLE PRECISION,
    "rightArmCm" DOUBLE PRECISION,
    "leftThighCm" DOUBLE PRECISION,
    "rightThighCm" DOUBLE PRECISION,
    "neckCm" DOUBLE PRECISION,
    "leftCalfCm" DOUBLE PRECISION,
    "rightCalfCm" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightEntryId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "pose" "BodyPhotoPose" NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "ChallengeType" NOT NULL,
    "objetivo" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "AchievementType" NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_logs" (
    "id" TEXT NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'RUNNING',
    "triggeredBy" "BackupTrigger" NOT NULL DEFAULT 'MANUAL',
    "filename" TEXT,
    "sizeBytes" INTEGER,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "backup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "muscle_groups_name_key" ON "muscle_groups"("name");

-- CreateIndex
CREATE INDEX "exercises_muscleGroupId_idx" ON "exercises"("muscleGroupId");

-- CreateIndex
CREATE INDEX "machine_models_primaryMuscleGroupId_idx" ON "machine_models"("primaryMuscleGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "gym_machines_internalQRCode_key" ON "gym_machines"("internalQRCode");

-- CreateIndex
CREATE INDEX "gym_machines_gymId_idx" ON "gym_machines"("gymId");

-- CreateIndex
CREATE INDEX "gym_machines_machineModelId_idx" ON "gym_machines"("machineModelId");

-- CreateIndex
CREATE INDEX "machine_weight_options_gymMachineId_idx" ON "machine_weight_options"("gymMachineId");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_alternatives_exerciseId_alternativeExerciseId_key" ON "exercise_alternatives"("exerciseId", "alternativeExerciseId");

-- CreateIndex
CREATE INDEX "workout_plans_userId_idx" ON "workout_plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workout_sets_workoutSessionId_workoutExerciseId_setNumber_key" ON "workout_sets"("workoutSessionId", "workoutExerciseId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "weight_entries_userId_date_key" ON "weight_entries"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "body_measurements_userId_date_key" ON "body_measurements"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_challenges_userId_challengeId_key" ON "user_challenges"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "backup_logs_status_idx" ON "backup_logs"("status");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "muscle_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_models" ADD CONSTRAINT "machine_models_primaryMuscleGroupId_fkey" FOREIGN KEY ("primaryMuscleGroupId") REFERENCES "muscle_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_machines" ADD CONSTRAINT "gym_machines_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_machines" ADD CONSTRAINT "gym_machines_machineModelId_fkey" FOREIGN KEY ("machineModelId") REFERENCES "machine_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_weight_options" ADD CONSTRAINT "machine_weight_options_gymMachineId_fkey" FOREIGN KEY ("gymMachineId") REFERENCES "gym_machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_alternatives" ADD CONSTRAINT "exercise_alternatives_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_alternatives" ADD CONSTRAINT "exercise_alternatives_alternativeExerciseId_fkey" FOREIGN KEY ("alternativeExerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "workout_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_gymMachineId_fkey" FOREIGN KEY ("gymMachineId") REFERENCES "gym_machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_photos" ADD CONSTRAINT "body_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_photos" ADD CONSTRAINT "body_photos_weightEntryId_fkey" FOREIGN KEY ("weightEntryId") REFERENCES "weight_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

