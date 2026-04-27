import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { calcularMacronutrientes, calcularNecesidadesCaloricas, generarPlanComidas } from "@/lib/diet-calculator"
import { generarPlanEjercicios } from "@/lib/tracking-system"
import { ensureWorkoutReminder } from "@/lib/server/reminders"

function normalizeMacrosForStorage(macros: ReturnType<typeof calcularMacronutrientes>) {
  return {
    ...macros,
    calories: Math.round(macros.calories),
    protein: Math.round(macros.protein),
    carbs: Math.round(macros.carbs),
    fat: Math.round(macros.fat),
    fiber: Math.round(macros.fiber),
    water: Number(macros.water.toFixed(1)),
  }
}

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const latest = await prisma.mealPlan.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  if (!latest) return NextResponse.json({ plan: null })

  return NextResponse.json({ plan: latest })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const force = !!body?.force

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  const goal = await prisma.goal.findUnique({ where: { userId: user.id } })
  if (!profile || !goal || !profile.weightKg || !profile.heightCm || !profile.age || !goal.targetWeightKg) {
    return apiError("Completa primero tu perfil", 400)
  }

  if (!force) {
    const existing = await prisma.mealPlan.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
    if (existing) {
      return NextResponse.json({ plan: existing })
    }
  }

  let objective: "perder" | "mantener" | "ganar" = "mantener"
  if (goal.targetWeightKg < profile.weightKg) objective = "perder"
  if (goal.targetWeightKg > profile.weightKg) objective = "ganar"

  const sex = profile.sex === "hombre" ? "hombre" : "mujer"
  const calories = calcularNecesidadesCaloricas(
    profile.weightKg,
    profile.heightCm,
    profile.age,
    sex,
    profile.trainingFrequency || "1-2",
    objective,
  )
  const macros = normalizeMacrosForStorage(calcularMacronutrientes(calories, profile.dietType || "Mediterránea"))
  const forbidden = (profile.forbiddenFoods || "")
    .split(",")
    .map((item: string) => item.trim())
    .filter((item: string) => item.length > 0)

  const mealPlan = generarPlanComidas(macros, profile.dietType || "Mediterránea", forbidden, profile.lunchTime || "14:00")
  const exercisePlan = generarPlanEjercicios(
    profile.trainingFrequency || "1-2",
    JSON.parse(profile.trainingPlaces || "[]"),
    JSON.parse(profile.homeEquipment || "[]"),
    "principiante",
  )

  const created = await prisma.mealPlan.create({
    data: {
      userId: user.id,
      caloriesTarget: macros.calories,
      proteinTarget: macros.protein,
      carbsTarget: macros.carbs,
      fatTarget: macros.fat,
      planJson: JSON.stringify({ mealPlan, exercisePlan, macros }),
    },
  })

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      lastCalculatedCalories: macros.calories,
      lastCalculatedProtein: macros.protein,
      lastCalculatedCarbs: macros.carbs,
      lastCalculatedFat: macros.fat,
    },
  })

  await ensureWorkoutReminder(user.id, profile.trainingFrequency)

  return NextResponse.json({ plan: created, mealPlan, exercisePlan, macros })
}
