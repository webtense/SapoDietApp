type UnknownRecord = Record<string, unknown>

export interface NormalizedMacros {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  water: number
}

export interface NormalizedMealIngredient {
  nombre: string
  cantidad: number
  unidad: string
  calorias: number
}

export interface NormalizedMeal {
  nombre: string
  ingredientes: NormalizedMealIngredient[]
  instrucciones: string[]
  calorias: number
  proteinas: number
  carbohidratos: number
  grasas: number
}

export interface NormalizedExercise {
  id: string
  name: string
  categoria: string
  sets?: number
  reps?: number
  duration?: number
  rest?: number
  muscleGroups?: string[]
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {}
}

function asNumber(value: unknown, fallback = 0, digits?: number) {
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed)) return fallback
  if (typeof digits === "number") {
    return Number(parsed.toFixed(digits))
  }
  return parsed
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && item.length > 0)
}

export function normalizeMacros(raw: unknown): NormalizedMacros {
  const record = asRecord(raw)
  return {
    calories: Math.round(asNumber(record.calories)),
    protein: Math.round(asNumber(record.protein ?? record.proteinas)),
    carbs: Math.round(asNumber(record.carbs ?? record.carbohidratos)),
    fat: Math.round(asNumber(record.fat ?? record.grasas)),
    fiber: Math.round(asNumber(record.fiber ?? record.fibra)),
    water: asNumber(record.water ?? record.agua, 2, 1),
  }
}

function normalizeIngredient(raw: unknown): NormalizedMealIngredient {
  const record = asRecord(raw)
  return {
    nombre: String(record.nombre ?? record.name ?? "Ingrediente"),
    cantidad: asNumber(record.cantidad ?? record.amount),
    unidad: String(record.unidad ?? record.unit ?? ""),
    calorias: Math.round(asNumber(record.calorias ?? record.calories)),
  }
}

export function normalizeMeal(raw: unknown): NormalizedMeal | null {
  const record = asRecord(raw)
  const name = String(record.nombre ?? record.name ?? "").trim()
  if (!name) return null

  return {
    nombre: name,
    ingredientes: Array.isArray(record.ingredientes)
      ? record.ingredientes.map(normalizeIngredient)
      : [],
    instrucciones: asStringArray(record.instrucciones ?? record.instructions),
    calorias: Math.round(asNumber(record.calorias ?? record.calories)),
    proteinas: Math.round(asNumber(record.proteinas ?? record.protein)),
    carbohidratos: Math.round(asNumber(record.carbohidratos ?? record.carbs)),
    grasas: Math.round(asNumber(record.grasas ?? record.fat)),
  }
}

export function normalizeMealPlan(raw: unknown) {
  const record = asRecord(raw)
  const entries = Object.entries(record)
    .map(([key, value]) => [key, normalizeMeal(value)] as const)
    .filter((entry): entry is readonly [string, NormalizedMeal] => !!entry[1])

  return Object.fromEntries(entries)
}

export function normalizeExercisePlan(raw: unknown): NormalizedExercise[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item, index) => {
      const record = asRecord(item)
      const id = String(record.id ?? record.exerciseId ?? index)
      const name = String(record.name ?? record.nombre ?? `Ejercicio ${index + 1}`)
      const categoria = String(record.categoria ?? record.category ?? "funcional")
      const muscleGroups = asStringArray(record.grupoMuscular ?? record.muscleGroups)
      const measurement = String(record.tipoMedicion ?? record.measurementType ?? "")

      let duration = asNumber(record.duration)
      let sets = asNumber(record.sets)
      let reps = asNumber(record.reps)

      if (!duration && measurement === "tiempo") duration = 45
      if (!sets && categoria === "fuerza") sets = 3
      if (!reps && measurement === "repeticiones") reps = categoria === "cardio" ? 12 : 10

      return {
        id,
        name,
        categoria,
        sets: sets || undefined,
        reps: reps || undefined,
        duration: duration || undefined,
        rest: asNumber(record.rest, 30) || 30,
        muscleGroups,
      }
    })
    .filter((item) => item.name)
}
