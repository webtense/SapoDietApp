import { prisma } from "@/lib/server/prisma"
import type { PlanType } from "@/lib/training/sequence"

interface ExerciseDef {
  name: string
  muscleGroup: string
  plannedSets: number
  plannedReps: number
}

interface PlanDef {
  name: string
  exercises: ExerciseDef[]
}

// Contenido genérico de gimnasio: A = empuje (pecho/hombro/tríceps),
// B = tirón (espalda/bíceps), C = pierna/core.
export const WORKOUT_PLAN_DEF: Record<PlanType, PlanDef> = {
  A: {
    name: "Plan A — Empuje (pecho, hombro, tríceps)",
    exercises: [
      { name: "Press banca", muscleGroup: "Pecho", plannedSets: 4, plannedReps: 8 },
      { name: "Press inclinado mancuernas", muscleGroup: "Pecho", plannedSets: 3, plannedReps: 10 },
      { name: "Press militar", muscleGroup: "Hombro", plannedSets: 3, plannedReps: 8 },
      { name: "Elevaciones laterales", muscleGroup: "Hombro", plannedSets: 3, plannedReps: 12 },
      { name: "Fondos en máquina", muscleGroup: "Tríceps", plannedSets: 3, plannedReps: 10 },
      { name: "Extensión de tríceps en polea", muscleGroup: "Tríceps", plannedSets: 3, plannedReps: 12 },
    ],
  },
  B: {
    name: "Plan B — Tirón (espalda, bíceps)",
    exercises: [
      { name: "Dominadas asistidas", muscleGroup: "Espalda", plannedSets: 4, plannedReps: 8 },
      { name: "Remo con barra", muscleGroup: "Espalda", plannedSets: 4, plannedReps: 8 },
      { name: "Jalón al pecho", muscleGroup: "Espalda", plannedSets: 3, plannedReps: 10 },
      { name: "Remo en máquina", muscleGroup: "Espalda", plannedSets: 3, plannedReps: 10 },
      { name: "Curl de bíceps con barra", muscleGroup: "Bíceps", plannedSets: 3, plannedReps: 10 },
      { name: "Curl martillo mancuernas", muscleGroup: "Bíceps", plannedSets: 3, plannedReps: 12 },
    ],
  },
  C: {
    name: "Plan C — Pierna y core",
    exercises: [
      { name: "Sentadilla", muscleGroup: "Pierna", plannedSets: 4, plannedReps: 8 },
      { name: "Prensa de piernas", muscleGroup: "Pierna", plannedSets: 4, plannedReps: 10 },
      { name: "Peso muerto rumano", muscleGroup: "Pierna", plannedSets: 3, plannedReps: 8 },
      { name: "Zancadas con mancuernas", muscleGroup: "Pierna", plannedSets: 3, plannedReps: 10 },
      { name: "Plancha frontal", muscleGroup: "Core", plannedSets: 3, plannedReps: 1 },
    ],
  },
}

async function ensureMuscleGroup(name: string) {
  return prisma.muscleGroup.upsert({
    where: { name },
    update: {},
    create: { name },
  })
}

async function ensureExercise(name: string, muscleGroupId: string) {
  const existing = await prisma.exercise.findFirst({ where: { name, muscleGroupId } })
  if (existing) return existing
  return prisma.exercise.create({ data: { name, muscleGroupId } })
}

/**
 * Idempotente: puede ejecutarse múltiples veces sin duplicar MuscleGroup,
 * Exercise, WorkoutPlan ni WorkoutExercise para el usuario dado.
 */
export async function assignWorkoutPlansToUser(userId: string) {
  const planTypes = Object.keys(WORKOUT_PLAN_DEF) as PlanType[]

  for (const planType of planTypes) {
    const def = WORKOUT_PLAN_DEF[planType]

    const exerciseRefs = []
    for (const exDef of def.exercises) {
      const muscleGroup = await ensureMuscleGroup(exDef.muscleGroup)
      const exercise = await ensureExercise(exDef.name, muscleGroup.id)
      exerciseRefs.push({ exercise, exDef })
    }

    let plan = await prisma.workoutPlan.findFirst({
      where: { userId, planType, active: true },
      orderBy: { versionNumber: "desc" },
    })

    if (!plan) {
      plan = await prisma.workoutPlan.create({
        data: {
          userId,
          name: def.name,
          planType,
          active: true,
          versionNumber: 1,
        },
      })
    }

    for (let i = 0; i < exerciseRefs.length; i++) {
      const { exercise, exDef } = exerciseRefs[i]
      const existingWorkoutExercise = await prisma.workoutExercise.findFirst({
        where: { workoutPlanId: plan.id, exerciseId: exercise.id },
      })

      if (existingWorkoutExercise) {
        await prisma.workoutExercise.update({
          where: { id: existingWorkoutExercise.id },
          data: {
            order: i,
            plannedSets: exDef.plannedSets,
            plannedReps: exDef.plannedReps,
          },
        })
      } else {
        await prisma.workoutExercise.create({
          data: {
            workoutPlanId: plan.id,
            order: i,
            exerciseId: exercise.id,
            plannedSets: exDef.plannedSets,
            plannedReps: exDef.plannedReps,
          },
        })
      }
    }
  }
}
