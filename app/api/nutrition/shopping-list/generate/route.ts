import { NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { getActivePlan } from "@/lib/nutrition/service"

interface PlanIngredient {
  nombre: string
  cantidad: number
  unidad?: string
}

interface PlanMeal {
  ingredientes?: PlanIngredient[]
}

const AISLE_MAP: Record<string, { category: string; aisle: string; estimatedPrice: number }> = {
  "pan pita": { category: "Panadería", aisle: "Panadería", estimatedPrice: 1.2 },
  "leche desnatada": { category: "Lácteos", aisle: "Refrigerados", estimatedPrice: 0.9 },
  "pechuga de pollo": { category: "Carnes", aisle: "Carnicería", estimatedPrice: 1.2 },
  huevos: { category: "Lácteos y Huevos", aisle: "Refrigerados", estimatedPrice: 0.3 },
  avena: { category: "Cereales", aisle: "Cereales", estimatedPrice: 0.4 },
  tomate: { category: "Verduras", aisle: "Frutas y Verduras", estimatedPrice: 0.3 },
  "aceite de oliva": { category: "Aceites", aisle: "Condimentos", estimatedPrice: 0.8 },
}

// Genera una lista de la compra a partir del plan activo del usuario (mealsJson).
// Reutiliza ShoppingList/ShoppingItem, igual que /api/shopping.
export async function POST() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const plan = await getActivePlan(user.id)
  if (!plan) return apiError("No tienes un plan nutricional activo", 404)
  if (!plan.mealsJson) return apiError("El plan no tiene comidas estructuradas todavía", 400)

  let meals: Record<string, PlanMeal>
  try {
    meals = JSON.parse(plan.mealsJson)
  } catch {
    return apiError("El plan tiene un formato de comidas inválido", 400)
  }

  const seen = new Set<string>()
  const items: Array<{ name: string; amount: number; unit: string; category: string; aisle: string; purchased: boolean; estimatedPrice: number }> = []

  for (const meal of Object.values(meals)) {
    for (const ing of meal.ingredientes || []) {
      const key = ing.nombre.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      const info = AISLE_MAP[key] || { category: "General", aisle: "Varios", estimatedPrice: 1.0 }
      items.push({
        name: ing.nombre,
        amount: ing.cantidad,
        unit: ing.unidad || "unidad",
        category: info.category,
        aisle: info.aisle,
        purchased: false,
        estimatedPrice: info.estimatedPrice,
      })
    }
  }

  if (items.length === 0) return apiError("No se encontraron ingredientes en el plan", 400)

  items.sort((a, b) => a.aisle.localeCompare(b.aisle))

  const list = await prisma.shoppingList.create({
    data: {
      userId: user.id,
      supermarket: "Mi Supermercado",
      totalEstimated: items.reduce((s, i) => s + i.estimatedPrice, 0),
      items: { create: items },
    },
    include: { items: true },
  })

  return NextResponse.json({ ok: true, shoppingList: list }, { status: 201 })
}
