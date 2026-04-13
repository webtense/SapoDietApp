import { startOfDay, startOfWeek, endOfWeek, subDays } from "date-fns"
import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { dailyLogSchema, exerciseLogSchema, mealLogSchema } from "@/lib/validation"

function normalizeDailyLog<T extends Record<string, any> | null>(item: T): T {
  if (!item) return item
  return {
    ...item,
    caloriesTarget: item.caloriesTarget == null ? null : Math.round(Number(item.caloriesTarget)),
    caloriesConsumed: item.caloriesConsumed == null ? null : Math.round(Number(item.caloriesConsumed)),
    waterTarget: item.waterTarget == null ? null : Number(Number(item.waterTarget).toFixed(1)),
    waterLiters: item.waterLiters == null ? null : Number(Number(item.waterLiters).toFixed(1)),
    weightKg: item.weightKg == null ? null : Number(Number(item.weightKg).toFixed(1)),
  } as T
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const today = startOfDay(new Date())

  if (type === "weekly") {
    const weekStart = startOfWeek(subDays(today, 1), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(subDays(today, 1), { weekStartsOn: 1 })

    const [dailyLogs, mealLogs, exerciseLogs] = await Promise.all([
      prisma.dailyLog.findMany({
        where: { userId: user.id, date: { gte: weekStart, lte: weekEnd } },
        orderBy: { date: "asc" },
      }),
      prisma.mealLog.findMany({
        where: { userId: user.id, date: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.exerciseLog.findMany({
        where: { userId: user.id, date: { gte: weekStart, lte: weekEnd } },
      }),
    ])

    const avgWeight = dailyLogs.length > 0
      ? dailyLogs.reduce((sum, d) => sum + (d.weightKg || 0), 0) / dailyLogs.filter(d => d.weightKg).length
      : null
    const avgWater = dailyLogs.length > 0
      ? dailyLogs.reduce((sum, d) => sum + (d.waterLiters || 0), 0) / dailyLogs.length
      : null
    const avgEnergy = dailyLogs.length > 0
      ? dailyLogs.reduce((sum, d) => sum + (d.energy || 0), 0) / dailyLogs.filter(d => d.energy).length
      : null
    const avgMood = dailyLogs.length > 0
      ? dailyLogs.reduce((sum, d) => sum + (d.mood || 0), 0) / dailyLogs.filter(d => d.mood).length
      : null

    return NextResponse.json({
      dailyLogs: dailyLogs.map((item) => normalizeDailyLog(item)),
      weeklyStats: {
        avgWeight: avgWeight || null,
        avgWater: avgWater || null,
        avgEnergy: avgEnergy || null,
        avgMood: avgMood || null,
        mealsCompleted: mealLogs.filter(m => m.completed).length,
        exercisesCompleted: exerciseLogs.filter(e => e.completed).length,
        totalMeals: mealLogs.length,
        totalExercises: exerciseLogs.length,
      },
    })
  }

  if (type === "all") {
    const [dailyLogs, mealLogs, exerciseLogs] = await Promise.all([
      prisma.dailyLog.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 90,
      }),
      prisma.mealLog.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 100,
      }),
      prisma.exerciseLog.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 100,
      }),
    ])
     return NextResponse.json({ dailyLogs: dailyLogs.map((item) => normalizeDailyLog(item)), mealLogs, exerciseLogs })
  }

  const [mealLogs, exerciseLogs, dailyLog] = await Promise.all([
    prisma.mealLog.findMany({ where: { userId: user.id, date: today } }),
    prisma.exerciseLog.findMany({ where: { userId: user.id, date: today } }),
    prisma.dailyLog.findUnique({ where: { userId_date: { userId: user.id, date: today } } }),
  ])

  return NextResponse.json({ mealLogs, exerciseLogs, dailyLog: normalizeDailyLog(dailyLog) })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const kind = body?.kind
  if (!["meal", "exercise", "daily"].includes(kind)) {
    return apiError("Tipo de registro inválido")
  }

  if (kind === "meal") {
    const parsed = mealLogSchema.safeParse(body.payload)
    if (!parsed.success) return apiError("Registro de comida inválido")

    const p = parsed.data
    const date = startOfDay(new Date(p.dateIso))
    const item = await prisma.mealLog.upsert({
      where: { userId_date_mealType: { userId: user.id, date, mealType: p.mealType } },
      create: {
        userId: user.id,
        date,
        mealType: p.mealType,
        completed: p.completed,
        consumedAt: p.completed ? new Date() : null,
        caloriesActual: p.caloriesActual,
        notes: p.notes,
        followsPlan: p.followsPlan ?? true,
      },
      update: {
        completed: p.completed,
        consumedAt: p.completed ? new Date() : null,
        caloriesActual: p.caloriesActual,
        notes: p.notes,
        followsPlan: p.followsPlan ?? true,
      },
    })
    return NextResponse.json({ item })
  }

  if (kind === "exercise") {
    const parsed = exerciseLogSchema.safeParse(body.payload)
    if (!parsed.success) return apiError("Registro de ejercicio inválido")

    const p = parsed.data
    const date = startOfDay(new Date(p.dateIso))
    const item = await prisma.exerciseLog.upsert({
      where: { userId_date_exerciseId: { userId: user.id, date, exerciseId: p.exerciseId } },
      create: {
        userId: user.id,
        date,
        exerciseId: p.exerciseId,
        completed: p.completed,
        durationSec: p.durationSec,
        setsJson: p.sets ? JSON.stringify(p.sets) : null,
      },
      update: {
        completed: p.completed,
        durationSec: p.durationSec,
        setsJson: p.sets ? JSON.stringify(p.sets) : null,
      },
    })
    return NextResponse.json({ item })
  }

  const parsed = dailyLogSchema.safeParse(body.payload)
  if (!parsed.success) return apiError("Registro diario inválido")
  const p = parsed.data
  const date = startOfDay(new Date(p.dateIso))

  const item = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: {
      userId: user.id,
      date,
      caloriesConsumed: p.caloriesConsumed,
      caloriesTarget: p.caloriesTarget,
      waterLiters: p.waterLiters,
      waterTarget: p.waterTarget,
      weightKg: p.weightKg,
      energy: p.energy,
      mood: p.mood,
    },
    update: {
      caloriesConsumed: p.caloriesConsumed,
      caloriesTarget: p.caloriesTarget,
      waterLiters: p.waterLiters,
      waterTarget: p.waterTarget,
      weightKg: p.weightKg,
      energy: p.energy,
      mood: p.mood,
    },
  })

  return NextResponse.json({ item })
}
