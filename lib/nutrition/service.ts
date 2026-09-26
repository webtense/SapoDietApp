import { prisma } from "@/lib/server/prisma"

// Cargar el plan activo de nutricionista para un usuario
// NOTA: NutritionistPlan.userId es @unique en el schema (una fila por usuario),
// así que "activo" en la práctica es equivalente a "el plan del usuario" con status ACTIVE.
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

export async function getPlanById(userId: string, planId: string) {
  return prisma.nutritionistPlan.findFirst({
    where: { id: planId, userId },
    include: { households: true },
  })
}

// Guardar o actualizar el plan de nutricionista (post-extracción desde PDF).
// Debido a la restricción @unique en userId, solo puede existir una fila por usuario:
// se actualiza en el sitio (incrementando version) en lugar de archivar+crear.
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
  const existing = await prisma.nutritionistPlan.findUnique({
    where: { userId },
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

  return prisma.nutritionistPlan.update({
    where: { userId },
    data: {
      ...data,
      status: "ACTIVE",
      version: existing.version + 1,
    },
    include: {
      households: true,
    },
  })
}

// Marca el plan como activo. Con la restricción actual de una fila por usuario
// no existen otros planes que archivar; se deja preparado por si en el futuro
// se relaja el @unique de userId para permitir historial de versiones.
export async function activatePlan(userId: string, planId: string) {
  const plan = await prisma.nutritionistPlan.findFirst({ where: { id: planId, userId } })
  if (!plan) return null

  await prisma.nutritionistPlan.updateMany({
    where: { userId, id: { not: planId }, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  })

  return prisma.nutritionistPlan.update({
    where: { id: planId },
    data: { status: "ACTIVE" },
    include: { households: true },
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

export async function updateHouseholdMember(
  id: string,
  data: { name?: string; age?: number | null; portionFactor?: number }
) {
  return prisma.householdMember.update({ where: { id }, data })
}

export async function deleteHouseholdMember(id: string) {
  return prisma.householdMember.delete({ where: { id } })
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

// Buscar sustituciones alternativas de un ingrediente dado su grupo de sustitución
export async function getSubstitutionsForGroup(groupName: string) {
  const group = await prisma.substitutionGroup.findUnique({
    where: { name: groupName },
    include: { items: { orderBy: { name: "asc" } } },
  })
  return group
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

export async function getEatingOutLogs(userId: string, limit = 30) {
  return prisma.eatingOutLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}
