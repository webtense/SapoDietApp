import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const type = body?.type

  if (type === "adapt") {
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
    if (!profile) return apiError("Perfil no encontrado", 404)

    const currentPlan = await prisma.mealPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    if (!currentPlan) return apiError("No hay plan generado", 400)

    const parsed = JSON.parse(currentPlan.planJson)
    const last7DaysMealLogs = await prisma.mealLog.findMany({
      where: {
        userId: user.id,
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        completed: true,
      },
    })

    const mealTypeCounts: Record<string, number> = {}
    last7DaysMealLogs.forEach(log => {
      mealTypeCounts[log.mealType] = (mealTypeCounts[log.mealType] || 0) + 1
    })

    const adaptaciones: string[] = []

    if (mealTypeCounts["desayuno"] > 5) {
      adaptaciones.push("El usuario come desayuno consistentemente - mantener")
    } else if (mealTypeCounts["desayuno"] === 0) {
      adaptaciones.push("Usuario omite desayuno - hacer más light el desayuno o mover a media mañana")
    }

    if (mealTypeCounts["cena"] > 5) {
      adaptaciones.push("Usuario cena tarde - hacer cena más ligera")
    }

    if (profile.dietType === "Vegetariana" || profile.dietType === "Vegana") {
      adaptaciones.push("Diet type: " + profile.dietType + " - ensuring plant-based proteins")
    }

    const forbidden = (profile.forbiddenFoods || "").split(",").map(s => s.trim()).filter(Boolean)
    if (forbidden.length > 0) {
      adaptaciones.push("Foods to avoid: " + forbidden.join(", "))
    }

    parsed.adaptations = adaptaciones

    await prisma.mealPlan.update({
      where: { id: currentPlan.id },
      data: { planJson: JSON.stringify(parsed) },
    })

    return NextResponse.json({
      adapted: true,
      adaptations: adaptaciones,
      plan: parsed,
    })
  }

  return apiError("Tipo de adaptación inválido", 400)
}