import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { shoppingListSchema } from "@/lib/validation"

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const latest = await prisma.shoppingList.findFirst({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ shoppingList: latest || null })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  let shoppingData

  if (!body || Object.keys(body).length === 0) {
    // Intentar generar desde el plan actual
    const latestPlan = await prisma.mealPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    if (!latestPlan) return apiError("No tienes un plan generado para crear la lista")

    const plan = JSON.parse(latestPlan.planJson)
    const mealPlan = plan.mealPlan || plan.planComidas
    if (!mealPlan) return apiError("El plan no tiene comidas definidas")

    const isHerbalife = (plan.supplementBrand || "") === "herbalife"

    const AISLE_MAP: Record<string, { category: string; aisle: string; estimatedPrice: number }> = {
      "fórmula 1 herbalife": { category: "Suplementos", aisle: "Suplementos Herbalife", estimatedPrice: 1.8 },
      "leche desnatada": { category: "Lácteos", aisle: "Refrigerados", estimatedPrice: 0.9 },
      "pechuga de pollo": { category: "Carnes", aisle: "Carnicería", estimatedPrice: 1.2 },
      "salmón": { category: "Pescados", aisle: "Pescadería", estimatedPrice: 2.0 },
      "huevos": { category: "Lácteos y Huevos", aisle: "Refrigerados", estimatedPrice: 0.3 },
      "lentejas": { category: "Legumbres", aisle: "Conservas", estimatedPrice: 0.4 },
      "arroz integral": { category: "Cereales", aisle: "Cereales", estimatedPrice: 0.3 },
      "avena": { category: "Cereales", aisle: "Cereales", estimatedPrice: 0.4 },
      "quinoa": { category: "Cereales", aisle: "Cereales", estimatedPrice: 0.6 },
      "batata": { category: "Verduras", aisle: "Frutas y Verduras", estimatedPrice: 0.3 },
      "brócoli": { category: "Verduras", aisle: "Frutas y Verduras", estimatedPrice: 0.6 },
      "espinacas": { category: "Verduras", aisle: "Frutas y Verduras", estimatedPrice: 0.5 },
      "tomate": { category: "Verduras", aisle: "Frutas y Verduras", estimatedPrice: 0.3 },
      "aguacate": { category: "Frutas", aisle: "Frutas y Verduras", estimatedPrice: 0.7 },
      "aceite de oliva": { category: "Aceites", aisle: "Condimentos", estimatedPrice: 0.8 },
      "almendras": { category: "Frutos Secos", aisle: "Frutos Secos", estimatedPrice: 1.5 },
      "plátano": { category: "Frutas", aisle: "Frutas y Verduras", estimatedPrice: 0.2 },
      "manzana": { category: "Frutas", aisle: "Frutas y Verduras", estimatedPrice: 0.3 },
      "naranja": { category: "Frutas", aisle: "Frutas y Verduras", estimatedPrice: 0.25 },
    }

    const ingredients: any[] = []
    const seen = new Set<string>()

    Object.values(mealPlan).forEach((meal: any) => {
      if (meal.ingredientes) {
        meal.ingredientes.forEach((ing: any) => {
          const key = ing.nombre.toLowerCase()
          if (!seen.has(key)) {
            seen.add(key)
            const info = AISLE_MAP[key] || { category: "General", aisle: "Varios", estimatedPrice: 1.0 }
            ingredients.push({
              name: ing.nombre,
              amount: ing.cantidad,
              unit: ing.unidad,
              category: info.category,
              aisle: info.aisle,
              purchased: false,
              estimatedPrice: info.estimatedPrice,
            })
          }
        })
      }
    })

    if (isHerbalife) {
      const extras = [
        { name: "Batido Proteico H24 Herbalife", amount: 1, unit: "bote", category: "Suplementos", aisle: "Suplementos Herbalife", estimatedPrice: 35 },
        { name: "Té Herbalife", amount: 1, unit: "bote", category: "Suplementos", aisle: "Suplementos Herbalife", estimatedPrice: 25 },
      ]
      extras.forEach((item) => {
        if (!seen.has(item.name.toLowerCase())) ingredients.push({ ...item, purchased: false })
      })
    }

    ingredients.sort((a, b) => {
      if (a.aisle.startsWith("Suplementos") && !b.aisle.startsWith("Suplementos")) return 1
      if (!a.aisle.startsWith("Suplementos") && b.aisle.startsWith("Suplementos")) return -1
      return a.aisle.localeCompare(b.aisle)
    })

    shoppingData = {
      supermarket: "Mi Supermercado",
      totalEstimated: ingredients.reduce((s, i) => s + (i.estimatedPrice || 0), 0),
      items: ingredients,
    }
  } else {
    const parsed = shoppingListSchema.safeParse(body)
    if (!parsed.success) return apiError("Lista de compra inválida")
    shoppingData = parsed.data
  }

  const list = await prisma.shoppingList.create({
    data: {
      userId: user.id,
      supermarket: shoppingData.supermarket,
      totalEstimated: shoppingData.totalEstimated,
      items: {
        create: shoppingData.items.map((item: any) => ({
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          category: item.category,
          aisle: item.aisle,
          purchased: item.purchased,
          estimatedPrice: item.estimatedPrice,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json({ shoppingList: list })
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const itemId = typeof body?.itemId === "string" ? body.itemId : ""
  const purchased = typeof body?.purchased === "boolean" ? body.purchased : null
  if (!itemId || purchased === null) return apiError("Datos inválidos")

  const item = await prisma.shoppingItem.findUnique({ where: { id: itemId }, include: { shoppingList: true } })
  if (!item || item.shoppingList.userId !== user.id) return apiError("No encontrado", 404)

  const updated = await prisma.shoppingItem.update({
    where: { id: itemId },
    data: { purchased },
  })

  return NextResponse.json({ item: updated })
}
