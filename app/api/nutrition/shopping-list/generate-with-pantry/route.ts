import { NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { getActivePlan, getPantry } from "@/lib/nutrition/service"
import { subtractPantryFromShoppingList, buildUseFirstReminders } from "@/lib/nutrition/pantry"

const CATEGORY_LABEL: Record<string, { category: string; aisle: string }> = {
  carnesPescadosHuevos: { category: "Carnes, pescados y huevos", aisle: "Carnicería y pescadería" },
  verdurasHortalizas: { category: "Verduras y hortalizas", aisle: "Frutas y verduras" },
  carbohidratosLegumbre: { category: "Carbohidratos y legumbre", aisle: "Cereales y conservas" },
  frutaYDespensa: { category: "Fruta y despensa", aisle: "Varios" },
  despensaYCondimentos: { category: "Despensa y condimentos", aisle: "Varios" },
  compraPersonalSemanalZoraida: { category: "Desayuno, tentempiés y lácteos", aisle: "Refrigerados" },
}

type ListaCompraEntry = string | { producto: string; cantidad: string }

function entryToName(entry: ListaCompraEntry) {
  return typeof entry === "string" ? entry : `${entry.producto} — ${entry.cantidad}`
}

// Mismo patrón que /shopping-list/generate, pero restando antes lo que ya
// hay en la despensa (ver lib/nutrition/pantry.ts para las reglas de resta).
export async function POST() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const plan = await getActivePlan(user.id)
  if (!plan) return apiError("No tienes un plan nutricional activo", 404)
  if (!plan.mealsJson) return apiError("El plan no tiene comidas estructuradas todavía", 400)

  let meals: Record<string, unknown>
  try {
    meals = JSON.parse(plan.mealsJson)
  } catch {
    return apiError("El plan tiene un formato de comidas inválido", 400)
  }

  const listaCompra =
    (meals.listaCompra4pax as Record<string, ListaCompraEntry[]> | undefined) ??
    (meals.listaCompraBase4pax as Record<string, ListaCompraEntry[]> | undefined)

  if (!listaCompra) {
    return apiError("Este plan todavía no tiene una lista de la compra calculada", 400)
  }

  const rawItems: Array<{ name: string; amount: number; unit: string; category: string; aisle: string }> = []
  for (const [section, entries] of Object.entries(listaCompra)) {
    const meta = CATEGORY_LABEL[section] ?? { category: section, aisle: "Varios" }
    for (const entry of entries) {
      rawItems.push({ name: entryToName(entry), amount: 1, unit: "", category: meta.category, aisle: meta.aisle })
    }
  }

  if (rawItems.length === 0) return apiError("No se encontraron artículos en la lista de la compra del plan", 400)

  const pantry = await getPantry(user.id)
  const subtracted = subtractPantryFromShoppingList(rawItems, pantry)
  const useFirstReminders = buildUseFirstReminders(pantry)

  const items = subtracted.map((item) => ({
    name: item.name,
    amount: item.amount ?? 1,
    unit: item.unit ?? "",
    category: item.category ?? "Varios",
    aisle: item.aisle ?? "Varios",
    purchased: false,
    estimatedPrice: 0,
  }))

  items.sort((a, b) => a.aisle.localeCompare(b.aisle))

  const list = await prisma.shoppingList.create({
    data: {
      userId: user.id,
      supermarket: "Mi Supermercado",
      totalEstimated: 0,
      items: { create: items },
    },
    include: { items: true },
  })

  return NextResponse.json(
    {
      ok: true,
      shoppingList: list,
      pantryNotes: subtracted.filter((i) => i.pantryNote).map((i) => ({ name: i.name, note: i.pantryNote })),
      useFirstReminders,
    },
    { status: 201 }
  )
}
