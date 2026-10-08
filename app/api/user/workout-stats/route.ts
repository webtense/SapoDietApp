import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireUser } from "@/lib/server/api"

function startOfDaysAgo(days: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

async function periodStats(userId: string, since: Date, until: Date) {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId, createdAt: { gte: since, lt: until } },
    include: {
      sets: {
        include: {
          workoutExercise: {
            include: {
              exercise: { select: { name: true, machineModel: { select: { group: true } } } },
            },
          },
        },
      },
    },
  })

  let volume = 0
  let prs = 0
  const muscleGroupCount: Record<string, number> = {}

  for (const session of sessions) {
    for (const set of session.sets) {
      if (!set.completed || set.skipped) continue
      volume += set.weight * set.reps
      if (set.maxWeight != null && set.weight >= set.maxWeight) prs += 1
      const group = set.workoutExercise.exercise.machineModel?.group ?? "FULL"
      muscleGroupCount[group] = (muscleGroupCount[group] ?? 0) + 1
    }
  }

  const topGroup = Object.entries(muscleGroupCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    workoutsCompleted: sessions.filter((s) => s.completedAt != null).length,
    workoutsTotal: sessions.length,
    volume: Math.round(volume),
    prs,
    topMuscleGroup: topGroup,
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get("days") ?? 7)
  const span = Number.isFinite(days) && days > 0 ? days : 7

  const now = new Date()
  const since = startOfDaysAgo(span)
  const previousSince = startOfDaysAgo(span * 2)

  const [current, previous] = await Promise.all([
    periodStats(user.id, since, now),
    periodStats(user.id, previousSince, since),
  ])

  // Adherencia semanal de las últimas 4 semanas, para la gráfica de barras
  const weeklyAdherence: { week: string; completed: number; planned: number; pct: number }[] = []
  for (let i = 3; i >= 0; i--) {
    const weekEnd = startOfDaysAgo(i * 7)
    const weekStart = startOfDaysAgo((i + 1) * 7)
    const sessions = await prisma.workoutSession.findMany({
      where: { userId: user.id, createdAt: { gte: weekStart, lt: weekEnd } },
      select: { completedAt: true },
    })
    const completed = sessions.filter((s) => s.completedAt != null).length
    const planned = sessions.length
    weeklyAdherence.push({
      week: weekStart.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
      completed,
      planned,
      pct: planned > 0 ? Math.round((completed / planned) * 100) : 0,
    })
  }

  return NextResponse.json({ current, previous, weeklyAdherence })
}
