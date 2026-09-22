import { prisma } from "@/lib/server/prisma"
import { nextPlanType } from "@/lib/training/sequence"

export type StartMode = "skip" | "free" | "planned"

export async function getCurrentWorkout(userId: string) {
  const completedCount = await prisma.workoutSession.count({
    where: {
      userId,
      sessionType: "PLANNED",
      completionStatus: "COMPLETED",
    },
  })

  const planType = nextPlanType(completedCount)

  const plan = await prisma.workoutPlan.findFirst({
    where: {
      userId,
      planType,
      active: true,
    },
    orderBy: { versionNumber: "desc" },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          gymMachine: true,
        },
      },
    },
  })

  return { planType, plan }
}

export async function startSession(
  userId: string,
  opts: { mode: StartMode; workoutPlanId?: string },
) {
  const now = new Date()

  if (opts.mode === "skip") {
    return prisma.workoutSession.create({
      data: {
        userId,
        workoutPlanId: opts.workoutPlanId,
        sessionType: "PLANNED",
        completionStatus: "SKIPPED",
        startTime: now,
        endTime: now,
      },
    })
  }

  if (opts.mode === "free") {
    return prisma.workoutSession.create({
      data: {
        userId,
        workoutPlanId: opts.workoutPlanId,
        sessionType: "FREE",
        completionStatus: "NOT_STARTED",
        startTime: now,
      },
    })
  }

  // planned
  if (!opts.workoutPlanId) {
    throw new Error("workoutPlanId es obligatorio para iniciar una sesión planificada")
  }

  const plan = await prisma.workoutPlan.findUnique({ where: { id: opts.workoutPlanId } })
  if (!plan || plan.userId !== userId) {
    throw new Error("Plan de entrenamiento no encontrado")
  }

  return prisma.workoutSession.create({
    data: {
      userId,
      workoutPlanId: plan.id,
      sessionType: "PLANNED",
      plannedPlanType: plan.planType,
      completionStatus: "NOT_STARTED",
      startTime: now,
    },
  })
}

export async function recordSet(params: {
  userId: string
  workoutSessionId: string
  workoutExerciseId: string
  setNumber: number
  weight?: number
  reps?: number
  rir?: number
  rpe?: number
  completed?: boolean
  skipped?: boolean
}) {
  const session = await prisma.workoutSession.findUnique({
    where: { id: params.workoutSessionId },
  })
  if (!session || session.userId !== params.userId) {
    throw new Error("Sesión de entrenamiento no encontrada")
  }

  const workoutExercise = await prisma.workoutExercise.findUnique({
    where: { id: params.workoutExerciseId },
  })
  if (!workoutExercise || workoutExercise.workoutPlanId !== session.workoutPlanId) {
    throw new Error("El ejercicio no pertenece al plan de esta sesión")
  }

  return prisma.workoutSet.upsert({
    where: {
      workoutSessionId_workoutExerciseId_setNumber: {
        workoutSessionId: params.workoutSessionId,
        workoutExerciseId: params.workoutExerciseId,
        setNumber: params.setNumber,
      },
    },
    update: {
      weight: params.weight,
      reps: params.reps,
      rir: params.rir,
      rpe: params.rpe,
      completed: params.completed ?? false,
      skipped: params.skipped ?? false,
    },
    create: {
      workoutSessionId: params.workoutSessionId,
      workoutExerciseId: params.workoutExerciseId,
      setNumber: params.setNumber,
      weight: params.weight,
      reps: params.reps,
      rir: params.rir,
      rpe: params.rpe,
      completed: params.completed ?? false,
      skipped: params.skipped ?? false,
    },
  })
}

export async function endSession(
  workoutSessionId: string,
  completionStatus: "COMPLETED" | "PARTIAL",
) {
  return prisma.workoutSession.update({
    where: { id: workoutSessionId },
    data: {
      endTime: new Date(),
      completionStatus,
    },
  })
}

export async function getLastForExercise(userId: string, exerciseId: string) {
  return prisma.workoutSet.findFirst({
    where: {
      completed: true,
      workoutExercise: { exerciseId },
      workoutSession: { userId },
    },
    orderBy: { createdAt: "desc" },
  })
}
