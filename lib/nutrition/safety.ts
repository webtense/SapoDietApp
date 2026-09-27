// Validador de seguridad puro. Jerarquía de prioridad (de más a menos
// importante): alergias del perfil > reglas del plan de nutricionista activo
// > objetivo macro/calórico > preferencias generales.
// No es sustituto de indicación médica/nutricional profesional real.

export interface SafetyContext {
  allergies: string[]
  forbiddenFoods: string[]
  dietType: string | null
}

export interface SafetyViolation {
  severity: "block" | "warn"
  reason: string
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

function matchesAny(haystack: string, needles: string[]): string | null {
  const normalizedHaystack = normalize(haystack)
  for (const needle of needles) {
    const normalizedNeedle = normalize(needle)
    if (!normalizedNeedle) continue
    if (normalizedHaystack.includes(normalizedNeedle)) return needle
  }
  return null
}

export function parseAllergies(allergiesJson: string | null | undefined): string[] {
  if (!allergiesJson) return []
  try {
    const parsed = JSON.parse(allergiesJson)
    return Array.isArray(parsed) ? parsed.filter((a) => typeof a === "string") : []
  } catch {
    return []
  }
}

export function parseForbiddenFoods(forbiddenFoods: string | null | undefined): string[] {
  if (!forbiddenFoods) return []
  return forbiddenFoods
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean)
}

export function checkRecipeSafety(
  recipe: { name: string; allergens: string | null; ingredients: { ingredient: string }[] },
  ctx: SafetyContext
): SafetyViolation[] {
  const violations: SafetyViolation[] = []

  // 1) Alergias (máxima prioridad): allergens de la receta + nombre de cada
  //    ingrediente, contra la lista de alergias del perfil.
  let allergensFromRecipe: string[] = []
  if (recipe.allergens) {
    try {
      const parsed = JSON.parse(recipe.allergens)
      if (Array.isArray(parsed)) allergensFromRecipe = parsed.filter((a) => typeof a === "string")
    } catch {
      // allergens con formato inesperado: se ignora, no se bloquea a ciegas
    }
  }

  if (ctx.allergies.length > 0) {
    for (const allergenTag of allergensFromRecipe) {
      const match = matchesAny(allergenTag, ctx.allergies)
      if (match) {
        violations.push({
          severity: "block",
          reason: `La receta "${recipe.name}" contiene el alérgeno "${allergenTag}", declarado como alergia del perfil.`,
        })
      }
    }
    for (const ing of recipe.ingredients) {
      const match = matchesAny(ing.ingredient, ctx.allergies)
      if (match) {
        violations.push({
          severity: "block",
          reason: `La receta "${recipe.name}" incluye "${ing.ingredient}", que coincide con la alergia "${match}" del perfil.`,
        })
      }
    }
  }

  // 2) Alimentos no deseados (forbiddenFoods) — aviso, no bloqueo.
  if (ctx.forbiddenFoods.length > 0) {
    for (const ing of recipe.ingredients) {
      const match = matchesAny(ing.ingredient, ctx.forbiddenFoods)
      if (match) {
        violations.push({
          severity: "warn",
          reason: `La receta "${recipe.name}" incluye "${ing.ingredient}", que coincide con un alimento no deseado ("${match}") del perfil.`,
        })
      }
    }
  }

  return violations
}

// Mínimos de seguridad ampliamente aceptados (no clínicos, no sustituyen
// supervisión profesional) para no recomendar objetivos peligrosamente
// hipocalóricos sin acompañamiento médico.
const MIN_CALORIES_FEMALE = 1200
const MIN_CALORIES_MALE = 1500

export function isCalorieTargetSafe(
  calories: number,
  sex: string | null,
  weightKg: number | null
): SafetyViolation[] {
  const violations: SafetyViolation[] = []
  const normalizedSex = sex ? normalize(sex) : null
  const isMale = normalizedSex === "hombre" || normalizedSex === "masculino" || normalizedSex === "m"
  const minCalories = isMale ? MIN_CALORIES_MALE : MIN_CALORIES_FEMALE

  if (calories < minCalories) {
    violations.push({
      severity: "block",
      reason: `El objetivo de ${calories} kcal/día está por debajo del mínimo de seguridad recomendado (${minCalories} kcal/día para ${
        isMale ? "hombres" : "mujeres"
      }). Este umbral es orientativo y no sustituye la indicación de un profesional sanitario.`,
    })
  }

  void weightKg // reservado para un ajuste futuro por peso corporal; hoy no se usa para no inventar una fórmula sin respaldo

  return violations
}
