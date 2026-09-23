-- CreateTable "NutritionistPlan"
CREATE TABLE "NutritionistPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pdfOriginal" TEXT,
    "extractedText" TEXT,
    "mealsJson" TEXT,
    "equivalencesJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionistPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable "HouseholdMember"
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "nutritionistPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "portionFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable "Recipe"
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mealType" TEXT NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "preparationTime" INTEGER,
    "cookingTime" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'NORMAL',
    "method" TEXT NOT NULL DEFAULT 'PLANCHA',
    "canFreeze" BOOLEAN NOT NULL DEFAULT false,
    "nutritionPerServing" TEXT,
    "allergens" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable "RecipeIngredient"
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredient" TEXT NOT NULL,
    "rawWeight" DOUBLE PRECISION,
    "cookedWeight" DOUBLE PRECISION,
    "drainedWeight" DOUBLE PRECISION,
    "frozenWeight" DOUBLE PRECISION,
    "substitutionGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable "RecipeVariant"
CREATE TABLE "RecipeVariant" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable "SubstitutionGroup"
CREATE TABLE "SubstitutionGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubstitutionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable "SubstitutionItem"
CREATE TABLE "SubstitutionItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "standardWeight" DOUBLE PRECISION NOT NULL,
    "caloriesPer100g" DOUBLE PRECISION,
    "proteinPer100g" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubstitutionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable "PantryItem"
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "recognizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable "EatingOutLog"
CREATE TABLE "EatingOutLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurant" TEXT,
    "mealType" TEXT NOT NULL,
    "selectedOption" TEXT,
    "estimatedCalories" DOUBLE PRECISION,
    "estimatedProtein" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EatingOutLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NutritionistPlan_userId_key" ON "NutritionistPlan"("userId");

-- CreateIndex
CREATE INDEX "NutritionistPlan_userId_status_idx" ON "NutritionistPlan"("userId", "status");

-- CreateIndex
CREATE INDEX "HouseholdMember_nutritionistPlanId_idx" ON "HouseholdMember"("nutritionistPlanId");

-- CreateIndex
CREATE INDEX "Recipe_mealType_idx" ON "Recipe"("mealType");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_substitutionGroup_idx" ON "RecipeIngredient"("recipeId", "substitutionGroup");

-- CreateIndex
CREATE INDEX "RecipeVariant_recipeId_idx" ON "RecipeVariant"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "SubstitutionGroup_name_key" ON "SubstitutionGroup"("name");

-- CreateIndex
CREATE INDEX "SubstitutionGroup_category_idx" ON "SubstitutionGroup"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SubstitutionItem_groupId_name_key" ON "SubstitutionItem"("groupId", "name");

-- CreateIndex
CREATE INDEX "SubstitutionItem_groupId_idx" ON "SubstitutionItem"("groupId");

-- CreateIndex
CREATE INDEX "PantryItem_userId_expiresAt_idx" ON "PantryItem"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "EatingOutLog_userId_createdAt_idx" ON "EatingOutLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "NutritionistPlan" ADD CONSTRAINT "NutritionistPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_nutritionistPlanId_fkey" FOREIGN KEY ("nutritionistPlanId") REFERENCES "NutritionistPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeVariant" ADD CONSTRAINT "RecipeVariant_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstitutionItem" ADD CONSTRAINT "SubstitutionItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SubstitutionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EatingOutLog" ADD CONSTRAINT "EatingOutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
