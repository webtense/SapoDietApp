// Escalado de recetas por comensal según HouseholdMember.portionFactor.
// Puro: no toca Prisma/Next, recibe los datos ya cargados.

export interface HouseholdMemberLike {
  id: string
  name: string
  portionFactor: number
}

export interface RecipeIngredientLike {
  id: string
  ingredient: string
  rawWeight: number | null
  cookedWeight: number | null
  drainedWeight: number | null
  frozenWeight: number | null
}

export interface RecipeWithIngredients {
  id: string
  name: string
  servings: number
  ingredients: RecipeIngredientLike[]
}

export interface ScaledIngredient {
  id: string
  ingredient: string
  rawWeight: number | null
  cookedWeight: number | null
  drainedWeight: number | null
  frozenWeight: number | null
}

export interface ScaledRecipe {
  id: string
  name: string
  originalServings: number
  targetPortions: number
  scaleFactor: number
  ingredients: ScaledIngredient[]
}

export function scaleIngredientWeight(weight: number, recipeServings: number, targetPortions: number): number {
  if (recipeServings <= 0) return weight
  const scaled = (weight / recipeServings) * targetPortions
  return Math.round(scaled * 10) / 10
}

export function getTargetPortions(members: HouseholdMemberLike[]): number {
  if (!members || members.length === 0) return 1.0
  return members.reduce((sum, m) => sum + (m.portionFactor ?? 1.0), 0)
}

export function scaleRecipeForHousehold(
  recipe: RecipeWithIngredients,
  members: HouseholdMemberLike[]
): ScaledRecipe {
  const targetPortions = getTargetPortions(members)
  const scaleFactor = recipe.servings > 0 ? targetPortions / recipe.servings : 1

  const scaleField = (weight: number | null): number | null =>
    weight == null ? null : scaleIngredientWeight(weight, recipe.servings, targetPortions)

  return {
    id: recipe.id,
    name: recipe.name,
    originalServings: recipe.servings,
    targetPortions,
    scaleFactor,
    ingredients: recipe.ingredients.map((ing) => ({
      id: ing.id,
      ingredient: ing.ingredient,
      rawWeight: scaleField(ing.rawWeight),
      cookedWeight: scaleField(ing.cookedWeight),
      drainedWeight: scaleField(ing.drainedWeight),
      frozenWeight: scaleField(ing.frozenWeight),
    })),
  }
}
