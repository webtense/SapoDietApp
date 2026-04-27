-- CreateMigration
-- Migration name: add_ai_quota_and_food_analysis
-- Created at: 2026-04-14T15:15:00.000Z

BEGIN;

-- Add AI quota fields to User
ALTER TABLE "User" ADD COLUMN "aiTokensUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "aiTokenLimit" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "lastAiTokenReset" TIMESTAMP(3);

-- Create FoodAnalysis table
CREATE TABLE "FoodAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "ingredients" TEXT,
    "mealType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoodAnalysis_pkey" PRIMARY KEY ("id")
);

-- Add foreign key
ALTER TABLE "FoodAnalysis" ADD CONSTRAINT "FoodAnalysis_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index
CREATE INDEX "FoodAnalysis_userId_createdAt_idx" ON "FoodAnalysis"("userId", "createdAt");

COMMIT;