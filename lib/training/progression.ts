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
