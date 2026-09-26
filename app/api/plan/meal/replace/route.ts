import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import type { Meal, MealPlan } from "@/lib/diet-calculator"

const VALID_MEAL_TYPES = ["desayuno", "mediaManana", "almuerzo", "merienda", "cena"]

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const mealType = body?.mealType as string | undefined
  const meal = body?.meal as Meal | undefined

  if (!mealType || !VALID_MEAL_TYPES.includes(mealType) || !meal?.nombre) {
    return apiError("Datos inválidos", 400)
  }

  const currentPlan = await prisma.mealPlan.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
  if (!currentPlan) return apiError("No hay plan generado", 404)

  let parsed: { mealPlan: MealPlan; [key: string]: unknown }
  try {
    parsed = JSON.parse(currentPlan.planJson)
  } catch {
    return apiError("El plan tiene un formato inválido", 400)
  }

  parsed.mealPlan[mealType as keyof MealPlan] = meal

  await prisma.mealPlan.update({
    where: { id: currentPlan.id },
    data: { planJson: JSON.stringify(parsed) },
  })

  return NextResponse.json({ ok: true, meal })
}
