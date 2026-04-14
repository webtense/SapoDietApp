import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"
import { profileSchema } from "@/lib/validation"
import { sanitizeText } from "@/lib/server/security"

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const [profile, goal] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.goal.findUnique({ where: { userId: user.id } }),
  ])

  return NextResponse.json({ profile, goal })
}

export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return apiError("Perfil inválido")
  }

  const data = parsed.data
  const viability = data.pesoMeta && data.tiempoMeta 
    ? (Math.abs(data.weight - data.pesoMeta) / data.tiempoMeta <= 1 ? "viable" : "ambiciosa")
    : null

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { 
        name: sanitizeText(data.name, 80),
        phone: data.phone ? sanitizeText(data.phone.replace(/\s/g, ''), 20) : null,
      },
    }),
    prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        age: data.age,
        heightCm: data.height,
        weightKg: data.weight,
        bodyType: sanitizeText(data.complexion, 40),
        sex: data.sex,
        wakeUpTime: data.horaLevantarse,
        sleepTime: data.horaAcostarse,
        lunchTime: data.horaAlmorzar,
        dietType: sanitizeText(data.tipoDieta, 60),
        forbiddenFoods: sanitizeText(data.alimentosNoPermitidos, 500),
        supermarket: sanitizeText(data.supermercado, 80),
        trainingFrequency: data.frecuenciaEntrenamiento,
        trainingPlaces: JSON.stringify(data.lugarEntrenamiento),
        homeEquipment: JSON.stringify(data.equipamiento),
        onboardingCompleted: true,
      },
      update: {
        age: data.age,
        heightCm: data.height,
        weightKg: data.weight,
        bodyType: sanitizeText(data.complexion, 40),
        sex: data.sex,
        wakeUpTime: data.horaLevantarse,
        sleepTime: data.horaAcostarse,
        lunchTime: data.horaAlmorzar,
        dietType: sanitizeText(data.tipoDieta, 60),
        forbiddenFoods: sanitizeText(data.alimentosNoPermitidos, 500),
        supermarket: sanitizeText(data.supermercado, 80),
        trainingFrequency: data.frecuenciaEntrenamiento,
        trainingPlaces: JSON.stringify(data.lugarEntrenamiento),
        homeEquipment: JSON.stringify(data.equipamiento),
        onboardingCompleted: true,
      },
    }),
    data.pesoMeta ? prisma.goal.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        targetWeightKg: data.pesoMeta,
        targetWeeks: data.tiempoMeta || 12,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        viabilityStatus: viability,
      },
      update: {
        ...(data.pesoMeta && { targetWeightKg: data.pesoMeta }),
        ...(data.tiempoMeta && { targetWeeks: data.tiempoMeta }),
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        viabilityStatus: viability,
      },
    }) : prisma.goal.findUnique({ where: { userId: user.id } }),
  ])

  return NextResponse.json({ ok: true, viability })
}
