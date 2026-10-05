import { prisma } from "@/lib/server/prisma"

export interface MaxWeightResult {
  weight: number
  date: Date
  userId: string
}

export interface GlobalMaxWeightResult extends MaxWeightResult {
  userName: string | null
}

/**
 * Máximo histórico de peso levantado por un usuario en un ejercicio concreto.
 * Usa `aggregate` con `_max` (no MAX() SQL manual) y una consulta adicional
 * para obtener la fecha/registro ganador, ya que `maxWeight` en WorkoutSet
 * no se mantiene automáticamente.
 */
export async function getMaxWeightByExercise(
  userId: string,
  exerciseId: string
): Promise<MaxWeightResult | null> {
  const agg = await prisma.workoutSet.aggregate({
    where: {
      workoutExercise: { exerciseId },
      workoutSession: { userId },
    },
    _max: { weight: true },
  })

  const maxWeight = agg._max.weight
  if (maxWeight == null) return null

  const winner = await prisma.workoutSet.findFirst({
    where: {
      workoutExercise: { exerciseId },
      workoutSession: { userId },
      weight: maxWeight,
    },
    orderBy: { createdAt: "desc" },
    select: { weight: true, createdAt: true },
  })

  if (!winner) return null

  return { weight: winner.weight, date: winner.createdAt, userId }
}

/**
 * Máximo histórico global (cualquier usuario) para un ejercicio, con quién lo logró.
 */
export async function getGlobalMaxWeight(
  exerciseId: string
): Promise<GlobalMaxWeightResult | null> {
  const agg = await prisma.workoutSet.aggregate({
    where: { workoutExercise: { exerciseId } },
    _max: { weight: true },
  })

  const maxWeight = agg._max.weight
  if (maxWeight == null) return null

  const winner = await prisma.workoutSet.findFirst({
    where: { workoutExercise: { exerciseId }, weight: maxWeight },
    orderBy: { createdAt: "desc" },
    select: {
      weight: true,
      createdAt: true,
      workoutSession: {
        select: { userId: true, user: { select: { name: true, displayName: true } } },
      },
    },
  })

  if (!winner) return null

  return {
    weight: winner.weight,
    date: winner.createdAt,
    userId: winner.workoutSession.userId,
    userName: winner.workoutSession.user.displayName || winner.workoutSession.user.name,
  }
}
