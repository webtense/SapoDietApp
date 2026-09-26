-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "chestCm" DOUBLE PRECISION,
ADD COLUMN     "cookingLevel" TEXT,
ADD COLUMN     "hasAirFryer" BOOLEAN,
ADD COLUMN     "hipCm" DOUBLE PRECISION,
ADD COLUMN     "onboardingVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "supplementsDetail" TEXT,
ADD COLUMN     "takesSupplements" BOOLEAN,
ADD COLUMN     "waistCm" DOUBLE PRECISION,
ADD COLUMN     "weeklyBudget" DOUBLE PRECISION;
