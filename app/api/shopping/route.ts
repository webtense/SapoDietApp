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

    // Extraer ingredientes únicos
    const ingredients: any[] = []
    const seen = new Set()

    Object.values(mealPlan).forEach((meal: any) => {
      if (meal.ingredientes) {
        meal.ingredientes.forEach((ing: any) => {
          const key = ing.nombre.toLowerCase()
          if (!seen.has(key)) {
            seen.add(key)
            ingredients.push({
              name: ing.nombre,
              amount: ing.cantidad,
              unit: ing.unidad,
              category: "General",
              aisle: "Por determinar",
              purchased: false,
              estimatedPrice: 0,
            })
          }
        })
      }
    })

    shoppingData = {
      supermarket: "Mi Supermercado",
      totalEstimated: 0,
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
