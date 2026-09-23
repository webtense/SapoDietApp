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
      sessionType: "PLANNED",
      completionStatus: "COMPLETED",
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
    select: { date: true, weightKg: true },
  })

  // Media móvil de ventana completa (días con datos hasta la fecha),
  // omitiendo días sin registro en vez de interpolar.
  const result: { date: Date; average: number }[] = []
  let runningSum = 0

  for (let i = 0; i < entries.length; i++) {
    runningSum += entries[i].weightKg
    const average = runningSum / (i + 1)
    result.push({ date: entries[i].date, average: Number(average.toFixed(2)) })
  }

  return result
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
    orderBy: { startTime: "asc" },
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
      date: session.startTime ?? session.createdAt,
      sessionId: session.id,
      sets,
      best1RM,
    }
  })
}
