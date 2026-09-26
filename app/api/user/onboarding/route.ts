import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { ensureWorkoutReminder } from "@/lib/server/reminders"
import { assignHighProteinPlanIfNeeded, isHighProteinDiet } from "@/lib/nutrition/high-protein-template"
import { z } from "zod"

const onboardingSchema = z.object({
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  age: z.number().min(1).max(120),
  sex: z.enum(["M", "F"]),
  goalWeightKg: z.number().min(30).max(300),
  goalDescription: z.string().min(5).max(500).optional(),
  trainingFrequency: z.enum(["1-2", "3-4", "5-6", "7"]),
  trainingLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  preferredEquipment: z.array(z.string()).default([]),
  dietType: z.string(),
  avoidFoods: z.string().optional().default(""),
  mealsPerDay: z.number().min(2).max(8).default(4),
})

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  try {
    const body = await req.json()
    const data = onboardingSchema.parse(body)

    const [profile] = await prisma.$transaction([
      prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          weightKg: data.weight,
          heightCm: data.height,
          age: data.age,
          sex: data.sex,
          dietType: data.dietType,
          forbiddenFoods: data.avoidFoods,
          trainingFrequency: data.trainingFrequency,
          homeEquipment: JSON.stringify(data.preferredEquipment),
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        },
        update: {
          weightKg: data.weight,
          heightCm: data.height,
          age: data.age,
          sex: data.sex,
          dietType: data.dietType,
          forbiddenFoods: data.avoidFoods,
          trainingFrequency: data.trainingFrequency,
          homeEquipment: JSON.stringify(data.preferredEquipment),
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        },
      }),
      prisma.goal.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          targetWeightKg: data.goalWeightKg,
        },
        update: {
          targetWeightKg: data.goalWeightKg,
        },
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
