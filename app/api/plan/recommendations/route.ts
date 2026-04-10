import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { obtenerRecomendacionesEjercicio } from "@/lib/tracking-system"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  if (type === "recommendations") {
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
    const goal = await prisma.goal.findUnique({ where: { userId: user.id } })

    if (!profile || !profile.age || !profile.weightKg || !profile.heightCm || !profile.sex) {
      return apiError("Completa tu perfil primero", 400)
    }

    let objetivo: "perder" | "mantener" | "ganar" = "mantener"
    if (goal?.targetWeightKg) {
      if (goal.targetWeightKg < profile.weightKg) objetivo = "perder"
      if (goal.targetWeightKg > profile.weightKg) objetivo = "ganar"
    }

    const lugarEntrenamiento = JSON.parse(profile.trainingPlaces || '["Casa"]')
    const equipamiento = JSON.parse(profile.homeEquipment || '["Ninguno"]')

    const result = obtenerRecomendacionesEjercicio({
      age: profile.age,
      sex: profile.sex || "mujer",
      weight: profile.weightKg,
      height: profile.heightCm,
      objetivo,
      lugarEntrenamiento,
      equipamiento,
    })

    return NextResponse.json(result)
  }

  return apiError("Tipo de solicitud inválido", 400)
}