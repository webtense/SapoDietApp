import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireUser } from "@/lib/server/api"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get("days") ?? 7)
  const take = Number(searchParams.get("take") ?? 10)

  const since = new Date()
  since.setDate(since.getDate() - (Number.isFinite(days) && days > 0 ? days : 7))

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(take) && take > 0 ? take : 10,
    include: {
      workoutPlan: { select: { planType: true } },
      sets: {
        include: {
          workoutExercise: {
            include: {
              exercise: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  const workouts = sessions.map((session) => {
    const completedSets = session.sets.filter((s) => s.completed && !s.skipped)
    const volume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
    const exerciseNames = Array.from(
      new Set(completedSets.map((s) => s.workoutExercise.exercise.name))
    )
    const durationSeconds = completedSets.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0)

    return {
      id: session.id,
      date: session.createdAt,
      completedAt: session.completedAt,
      planType: session.workoutPlan?.planType ?? null,
      durationMinutes: durationSeconds > 0 ? Math.round(durationSeconds / 60) : null,
      exercises: exerciseNames,
      setsCount: completedSets.length,
      volume: Math.round(volume),
    }
  })

  return NextResponse.json({ workouts })
}
