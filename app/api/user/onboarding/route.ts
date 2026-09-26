import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { ensureWorkoutReminder } from "@/lib/server/reminders"
import { assignHighProteinPlanIfNeeded, isHighProteinDiet } from "@/lib/nutrition/high-protein-template"
import { seedDefaultMachines } from "@/lib/gyms/default-machines"
import { z } from "zod"

const onboardingSchema = z.object({
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  age: z.number().min(1).max(120),
  sex: z
    .string()
    .transform((v) => {
      const n = v.trim().toLowerCase()
      if (n === "m" || n === "hombre") return "hombre"
      if (n === "f" || n === "mujer") return "mujer"
      return v
    })
    .pipe(z.enum(["hombre", "mujer"])),
  bodyType: z.string().max(60).optional(),

  waist: z.number().min(20).max(300).optional(),
  hip: z.number().min(20).max(300).optional(),
  chest: z.number().min(20).max(300).optional(),

  goalWeightKg: z.number().min(30).max(300),
  goalDescription: z.string().min(5).max(500).optional(),

  trainingFrequency: z.enum(["1-2", "3-4", "5-6", "7"]),
  trainingLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  preferredEquipment: z.array(z.string()).default([]),

  gymAction: z.enum(["join", "create", "skip"]).default("skip"),
  gymId: z.string().min(1).optional(),
  gymName: z.string().min(1).max(120).optional(),

  dietType: z.string(),
  avoidFoods: z.string().optional().default(""),
  mealsPerDay: z.number().min(2).max(8).default(4),
  allergies: z.array(z.string()).default([]),

  hasAirFryer: z.boolean().optional(),
  takesSupplements: z.boolean().optional(),
  supplementsDetail: z.array(z.string()).default([]),

  cookingLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  weeklyBudget: z.number().min(0).max(10000).optional(),
})

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  try {
    const body = await req.json()
    const data = onboardingSchema.parse(body)

    let gymId: string | undefined

    if (data.gymAction === "join") {
      if (!data.gymId) {
        return NextResponse.json({ error: "Falta el gimnasio a unirse" }, { status: 400 })
      }
      const gym = await prisma.gym.findUnique({ where: { id: data.gymId } })
      if (!gym || (!gym.isPublic && gym.createdById !== user.id)) {
        return NextResponse.json({ error: "Gimnasio no encontrado" }, { status: 404 })
      }
      gymId = gym.id
    } else if (data.gymAction === "create") {
      if (!data.gymName) {
        return NextResponse.json({ error: "Falta el nombre del gimnasio" }, { status: 400 })
      }
      const gym = await prisma.gym.create({
        data: { name: data.gymName, createdById: user.id, isPublic: true },
      })
      await seedDefaultMachines(gym.id)
      gymId = gym.id
    }

    const allergiesJson = data.allergies.length ? JSON.stringify(data.allergies) : null
    const supplementsDetailJson =
      data.takesSupplements && data.supplementsDetail.length
        ? JSON.stringify(data.supplementsDetail)
        : null

    const profileCommon = {
      weightKg: data.weight,
      heightCm: data.height,
      age: data.age,
      sex: data.sex,
      bodyType: data.bodyType,
      dietType: data.dietType,
      forbiddenFoods: data.avoidFoods,
      trainingFrequency: data.trainingFrequency,
      homeEquipment: JSON.stringify(data.preferredEquipment),
      waistCm: data.waist,
      hipCm: data.hip,
      chestCm: data.chest,
      allergies: allergiesJson,
      hasAirFryer: data.hasAirFryer,
      takesSupplements: data.takesSupplements,
      supplementsDetail: supplementsDetailJson,
      cookingLevel: data.cookingLevel,
      weeklyBudget: data.weeklyBudget,
      onboardingVersion: 4,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      ...(gymId ? { gymId } : {}),
    }

    const [profile] = await prisma.$transaction([
      prisma.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...profileCommon },
        update: profileCommon,
      }),
      prisma.goal.upsert({
        where: { userId: user.id },
        create: { userId: user.id, targetWeightKg: data.goalWeightKg },
        update: { targetWeightKg: data.goalWeightKg },
      }),
    ])

    await ensureWorkoutReminder(user.id, data.trainingFrequency)

    if (isHighProteinDiet(data.dietType)) {
      await assignHighProteinPlanIfNeeded(user.id).catch(() => null)
    }

    return NextResponse.json({
      ok: true,
      message: "Onboarding completado",
      profile,
    })
  } catch (err) {
    const message = err instanceof z.ZodError
      ? `Validación: ${err.errors[0].message}`
      : err instanceof Error
      ? err.message
      : "Error guardando onboarding"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
