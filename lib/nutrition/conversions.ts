// Conversión entre los 4 tipos de peso de un ingrediente (crudo/cocinado/
// escurrido/congelado). NO existe un ratio universal fiable entre estados
// (varía mucho por alimento: una merluza cocida pierde agua distinto que
// una legumbre, un escurrido de conserva no es comparable a un cocinado al
// vapor). Por eso esta pieza NUNCA inventa un factor de conversión: solo
// sabe convertir cuando el propio dato ya existe explícito en el ingrediente
// (p.ej. si rawWeight y cookedWeight están ambos rellenos a mano en la receta,
// se puede citar cookedWeight como el "peso cocinado" real de esa receta,
// pero no derivarlo matemáticamente de rawWeight).

export type WeightKind = "raw" | "cooked" | "drained" | "frozen"

export interface WeightedIngredient {
  rawWeight: number | null
  cookedWeight: number | null
  drainedWeight: number | null
  frozenWeight: number | null
}

const FIELD_BY_KIND: Record<WeightKind, keyof WeightedIngredient> = {
  raw: "rawWeight",
  cooked: "cookedWeight",
  drained: "drainedWeight",
  frozen: "frozenWeight",
}

// Prioridad de fallback: rawWeight (el más usado en las recetas ya sembradas)
// > drainedWeight (conservas, también ya usado) > cookedWeight > frozenWeight,
// de más frecuente/fiable a menos en los datos actuales del proyecto.
const FALLBACK_ORDER: WeightKind[] = ["raw", "drained", "cooked", "frozen"]

export function getBestAvailableWeight(
  ingredient: WeightedIngredient
): { weight: number; kind: WeightKind } | null {
  for (const kind of FALLBACK_ORDER) {
    const value = ingredient[FIELD_BY_KIND[kind]]
    if (value != null) return { weight: value, kind }
  }
  return null
}

// Devuelve el peso ya almacenado explícitamente para `to`, si existe.
// No deriva un valor a partir de otro estado: sin dato explícito, null.
export function convertWeight(
  ingredient: WeightedIngredient,
  from: WeightKind,
  to: WeightKind
): number | null {
  if (from === to) return ingredient[FIELD_BY_KIND[from]]
  return ingredient[FIELD_BY_KIND[to]]
}
