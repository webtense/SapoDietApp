import { NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { getActivePlan } from "@/lib/nutrition/service"

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

// Genera la lista de la compra a partir de la sección de lista de compra ya
// agregada del plan activo (mealsJson.listaCompra4pax / listaCompraBase4pax),
// no de los ingredientes sueltos por comida: esa sección ya viene calculada
// por el propio plan (4 o 6 personas, categorizada), es la fuente fiable.
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

  // listaCompra4pax (plan de Zoraida) / listaCompraBase4pax (plan genérico) viven
  // siempre en la raíz del mealsJson, aunque el resto del plan de Zoraida esté
  // anidado bajo estructuraDiaria.
  const listaCompra =
    (meals.listaCompra4pax as Record<string, ListaCompraEntry[]> | undefined) ??
    (meals.listaCompraBase4pax as Record<string, ListaCompraEntry[]> | undefined)

  if (!listaCompra) {
    return apiError("Este plan todavía no tiene una lista de la compra calculada", 400)
  }

  const items: Array<{ name: string; amount: number; unit: string; category: string; aisle: string; purchased: boolean; estimatedPrice: number }> = []

  for (const [section, entries] of Object.entries(listaCompra)) {
    const meta = CATEGORY_LABEL[section] ?? { category: section, aisle: "Varios" }
    for (const entry of entries) {
      items.push({
        name: entryToName(entry),
        amount: 1,
        unit: "",
        category: meta.category,
        aisle: meta.aisle,
        purchased: false,
        estimatedPrice: 0,
      })
    }
  }

  if (items.length === 0) return apiError("No se encontraron artículos en la lista de la compra del plan", 400)

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

  return NextResponse.json({ ok: true, shoppingList: list }, { status: 201 })
}
