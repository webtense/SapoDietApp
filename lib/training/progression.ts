import { prisma } from "@/lib/server/prisma"

export function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

export async function getTotalVolume(userId: string, since: Date): Promise<number> {
  const sets = await prisma.workoutSet.findMany({
    where: {
      completed: true,
      createdAt: { gte: since },
      workoutSession: { userId },
    },
    select: { weight: true, reps: true },
  })

  return sets.reduce((total, set) => total + (set.weight ?? 0) * (set.reps ?? 0), 0)
}

export async function getConsistencyPercent(
  userId: string,
  weeklyTarget: number,
  sinceWeeks: number,
): Promise<number> {
  if (weeklyTarget <= 0 || sinceWeeks <= 0) return 0

  const since = new Date(Date.now() - sinceWeeks * 7 * 24 * 60 * 60 * 1000)

  const completedSessions = await prisma.workoutSession.count({
    where: {
      userId,
      completedAt: { not: null },
      createdAt: { gte: since },
    },
  })

  const target = weeklyTarget * sinceWeeks
  const percent = (completedSessions / target) * 100

  return Math.min(100, percent)
}

export async function getWeightMovingAverage(userId: string, days: number) {
  if (days <= 0) return []

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const entries = await prisma.weightEntry.findMany({
    where: {
      userId,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
    select: { date: true, weight: true },
  })

  // Media móvil de ventana completa (días con datos hasta la fecha),
  // omitiendo días sin registro en vez de interpolar.
  const result: { date: Date; average: number }[] = []
  let runningSum = 0

  for (let i = 0; i < entries.length; i++) {
    runningSum += entries[i].weight
    const average = runningSum / (i + 1)
    result.push({ date: entries[i].date, average: Number(average.toFixed(2)) })
  }

  return result
}

export interface ExerciseHistoryResult {
  dates: string[]
  maxWeight: (number | null)[]
  weeklyVolume: number[]
  estimatedOneRM: (number | null)[]
  sufficientData: boolean
}

/**
 * Histórico de una máquina (vía exerciseId) para gráficas de evolución:
 * peso máximo por día, volumen acumulado por semana y 1RM estimado por día.
 */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  days: 30 | 90 | 365,
): Promise<ExerciseHistoryResult> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const sets = await prisma.workoutSet.findMany({
    where: {
      completed: true,
      createdAt: { gte: since },
      workoutExercise: { exerciseId },
      workoutSession: { userId },
    },
    select: { weight: true, reps: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  if (sets.length < 3) {
    return { dates: [], maxWeight: [], weeklyVolume: [], estimatedOneRM: [], sufficientData: false }
  }

  // Agrupar por día (peso máximo, 1RM) y por semana (volumen acumulado)
  const byDay = new Map<string, { maxWeight: number; best1RM: number }>()
  const byWeek = new Map<string, number>()

  function dayKey(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  function weekKey(d: Date) {
    const date = new Date(d)
    const day = (date.getUTCDay() + 6) % 7 // lunes=0
    date.setUTCDate(date.getUTCDate() - day)
    return date.toISOString().slice(0, 10)
  }

  for (const set of sets) {
    if (set.weight == null || set.reps == null) continue

    const dKey = dayKey(set.createdAt)
    const existing = byDay.get(dKey)
    const oneRm = epley1RM(set.weight, set.reps)
    if (!existing) {
      byDay.set(dKey, { maxWeight: set.weight, best1RM: oneRm })
    } else {
      byDay.set(dKey, {
        maxWeight: Math.max(existing.maxWeight, set.weight),
        best1RM: Math.max(existing.best1RM, oneRm),
      })
    }

    const wKey = weekKey(set.createdAt)
    const volume = set.weight * set.reps
    byWeek.set(wKey, (byWeek.get(wKey) ?? 0) + volume)
  }

  const sortedDays = Array.from(byDay.keys()).sort()
  const dates = sortedDays
  const maxWeight = sortedDays.map((d) => byDay.get(d)!.maxWeight)
  const estimatedOneRM = sortedDays.map((d) => Number(byDay.get(d)!.best1RM.toFixed(1)))

  const sortedWeeks = Array.from(byWeek.keys()).sort()
  const weeklyVolume = sortedWeeks.map((w) => Number(byWeek.get(w)!.toFixed(0)))

  return { dates, maxWeight, weeklyVolume, estimatedOneRM, sufficientData: true }
}

export interface ExerciseProgressionSetPoint {
  setNumber: number
  weight: number | null
  reps: number | null
}

export interface ExerciseProgressionSession {
  date: Date
  sessionId: string
  sets: ExerciseProgressionSetPoint[]
  best1RM: number | null
}

export async function getExerciseProgression(
  userId: string,
  exerciseId: string,
  limit = 20,
): Promise<ExerciseProgressionSession[]> {
  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      sets: {
        some: {
          completed: true,
          workoutExercise: { exerciseId },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      sets: {
        where: {
          completed: true,
          workoutExercise: { exerciseId },
        },
        orderBy: { setNumber: "asc" },
      },
    },
  })

  return sessions.map((session) => {
    const sets = session.sets.map((s) => ({
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
    }))

    let best1RM: number | null = null
    for (const s of sets) {
      if (s.weight != null && s.reps != null) {
        const oneRm = epley1RM(s.weight, s.reps)
        if (best1RM == null || oneRm > best1RM) best1RM = oneRm
      }
    }

    return {
      date: session.completedAt ?? session.createdAt,
      sessionId: session.id,
      sets,
      best1RM,
    }
  })
}
