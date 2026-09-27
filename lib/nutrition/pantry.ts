// Lógica pura de "modo despensa": resta lo que ya tienes en casa de la lista
// de la compra generada. No convierte unidades distintas (g vs kg, unidad vs
// ml...) de forma exacta: si las unidades no coinciden, solo informa de que
// ya tienes ALGO de ese producto, sin descontar cantidad.

export interface ShoppingListItemLike {
  name: string
  amount?: number
  unit?: string
  category?: string
  aisle?: string
}

export interface PantryItemLike {
  name: string
  quantity: number
  unit: string
  expiresAt: Date | null
}

export interface SubtractedShoppingItem extends ShoppingListItemLike {
  alreadyInPantry: boolean
  pantryNote: string | null
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

const SOON_EXPIRING_DAYS = 3

export function getExpiringSoonItems(pantryItems: PantryItemLike[], now: Date = new Date()): PantryItemLike[] {
  const limit = new Date(now.getTime() + SOON_EXPIRING_DAYS * 24 * 60 * 60 * 1000)
  return pantryItems.filter((item) => item.expiresAt != null && item.expiresAt <= limit && item.expiresAt >= now)
}

export function subtractPantryFromShoppingList(
  shoppingItems: ShoppingListItemLike[],
  pantryItems: PantryItemLike[]
): SubtractedShoppingItem[] {
  const pantryByName = new Map<string, PantryItemLike>()
  for (const p of pantryItems) {
    pantryByName.set(normalize(p.name), p)
  }

  return shoppingItems
    .map((item) => {
      const pantryMatch = pantryByName.get(normalize(item.name))
      if (!pantryMatch) {
        return { ...item, alreadyInPantry: false, pantryNote: null }
      }

      const sameUnit = item.unit && pantryMatch.unit && normalize(item.unit) === normalize(pantryMatch.unit)

      if (sameUnit && item.amount != null) {
        const remaining = item.amount - pantryMatch.quantity
        if (remaining <= 0) {
          return {
            ...item,
            amount: 0,
            alreadyInPantry: true,
            pantryNote: `Ya tienes suficiente en la despensa (${pantryMatch.quantity} ${pantryMatch.unit}), no hace falta comprarlo.`,
          }
        }
        return {
          ...item,
          amount: remaining,
          alreadyInPantry: true,
          pantryNote: `Tienes ${pantryMatch.quantity} ${pantryMatch.unit} en la despensa; se ha descontado de la cantidad a comprar.`,
        }
      }

      // Unidades distintas o amount desconocido: no se puede restar con precisión.
      return {
        ...item,
        alreadyInPantry: true,
        pantryNote: `Ya tienes algo de "${pantryMatch.name}" en la despensa (${pantryMatch.quantity} ${pantryMatch.unit}), revisa si te hace falta comprar más.`,
      }
    })
    .filter((item) => !(item.alreadyInPantry && item.amount === 0))
}

export function buildUseFirstReminders(pantryItems: PantryItemLike[], now: Date = new Date()): string[] {
  return getExpiringSoonItems(pantryItems, now).map(
    (item) => `Usar primero: "${item.name}" caduca el ${item.expiresAt!.toLocaleDateString("es-ES")}.`
  )
}
