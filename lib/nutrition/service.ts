import { prisma } from "@/lib/server/prisma"

// Cargar el plan activo de nutricionista para un usuario
export async function getActivePlan(userId: string) {
  return prisma.nutritionistPlan.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      households: true,
    },
  })
}

// Guardar o actualizar un plan de nutricionista (post-extracción desde PDF)
export async function saveNutritionistPlan(
  userId: string,
  data: {
    pdfOriginal?: string
    extractedText?: string
    mealsJson?: string
    equivalencesJson?: string
    needsReview?: boolean
    version?: number
  }
) {
  const existing = await prisma.nutritionistPlan.findFirst({
    where: { userId },
    orderBy: { version: "desc" },
  })

  if (!existing) {
    return prisma.nutritionistPlan.create({
      data: {
        userId,
        ...data,
        status: "ACTIVE",
        version: 1,
      },
      include: {
        households: true,
      },
    })
  }

  // Archive el anterior y crear nuevo
  await prisma.nutritionistPlan.update({
    where: { id: existing.id },
    data: { status: "ARCHIVED" },
  })

  return prisma.nutritionistPlan.create({
    data: {
      userId,
      ...data,
      status: "ACTIVE",
      version: existing.version + 1,
    },
    include: {
      households: true,
    },
  })
}

// Crear o actualizar miembros del hogar
export async function addHouseholdMember(
  nutritionistPlanId: string,
  name: string,
  age?: number,
  portionFactor: number = 1.0
) {
  return prisma.householdMember.create({
    data: {
      nutritionistPlanId,
      name,
      age,
      portionFactor,
    },
  })
}

// Listar miembros del hogar
export async function getHouseholdMembers(nutritionistPlanId: string) {
  return prisma.householdMember.findMany({
    where: { nutritionistPlanId },
    orderBy: { createdAt: "asc" },
  })
}

// Crear receta con ingredientes
export async function createRecipe(data: {
  name: string
  description?: string
  mealType: string
  servings?: number
  preparationTime?: number
  cookingTime?: number
  difficulty?: string
  method?: string
  canFreeze?: boolean
  nutritionPerServing?: string
  allergens?: string
  ingredients: Array<{
    ingredient: string
    rawWeight?: number
    cookedWeight?: number
    drainedWeight?: number
    frozenWeight?: number
    substitutionGroup?: string
  }>
}) {
  const { ingredients, ...recipeData } = data

  return prisma.recipe.create({
    data: {
      ...recipeData,
      ingredients: {
        createMany: {
          data: ingredients,
        },
      },
    },
    include: {
      ingredients: true,
    },
  })
}

// Crear grupo de sustituciones (ej: "PROTEINA_BLANCA")
export async function createSubstitutionGroup(name: string, category: string) {
  return prisma.substitutionGroup.upsert({
    where: { name },
    create: { name, category },
    update: {},
    include: {
      items: true,
    },
  })
}

// Añadir item a grupo de sustituciones
export async function addSubstitutionItem(
  groupId: string,
  name: string,
  standardWeight: number,
  caloriesPer100g?: number,
  proteinPer100g?: number
) {
  return prisma.substitutionItem.upsert({
    where: { groupId_name: { groupId, name } },
    create: {
      groupId,
      name,
      standardWeight,
      caloriesPer100g,
      proteinPer100g,
    },
    update: {
      standardWeight,
      caloriesPer100g,
      proteinPer100g,
    },
  })
}

// Registrar item en despensa
export async function addPantryItem(
  userId: string,
  name: string,
  quantity: number,
  unit: string,
  expiresAt?: Date
) {
  return prisma.pantryItem.create({
    data: {
      userId,
      name,
      quantity,
      unit,
      expiresAt,
    },
  })
}

// Obtener despensa (ordenada por fecha de vencimiento)
export async function getPantry(userId: string) {
  return prisma.pantryItem.findMany({
    where: { userId },
    orderBy: {
      expiresAt: { sort: "asc", nulls: "last" },
    },
  })
}

// Registrar comida fuera de casa
export async function logEatingOut(
  userId: string,
  data: {
    restaurant?: string
    mealType: "COMIDA" | "CENA"
    selectedOption?: string
    estimatedCalories?: number
    estimatedProtein?: number
    notes?: string
  }
) {
  return prisma.eatingOutLog.create({
    data: {
      userId,
      ...data,
    },
  })
}
