import { prisma } from "@/lib/server/prisma"

export async function refreshChallengeProgress(challengeId: string) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) throw new Error("Reto no encontrado")

  const desde = challenge.fechaInicio ?? challenge.createdAt
  const hasta = challenge.fechaFin ?? new Date()
  const participants = await prisma.userChallenge.findMany({ where: { challengeId } })

  for (const participant of participants) {
    const progress = await prisma.workoutSession.count({
      where: {
        userId: participant.userId,
        completedAt: { not: null, gte: desde, lte: hasta },
      },
    })

    const completed = progress >= challenge.objetivo
    const wasCompleted = participant.completed

    await prisma.userChallenge.update({
      where: { id: participant.id },
      data: {
        progress,
        completed,
        completedAt: completed && !wasCompleted ? new Date() : participant.completedAt,
      },
    })

    if (completed && !wasCompleted) {
      await unlockAchievement(participant.userId, "RETO_COMPLETADO", { challengeId, challengeName: challenge.name })
    }
  }

  if (challenge.fechaFin && challenge.fechaFin < new Date() && challenge.status === "ACTIVO") {
    await prisma.challenge.update({ where: { id: challengeId }, data: { status: "FINALIZADO" } })
  }
}

export async function getLeaderboard(challengeId: string) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) throw new Error("Reto no encontrado")

  const participants = await prisma.userChallenge.findMany({
    where: { challengeId },
    include: { user: { select: { id: true, name: true } } },
  })

  return participants
    .map(p => ({
      userId: p.userId,
      userName: p.user.name,
      progress: p.progress,
      completed: p.completed,
    }))
    .sort((a, b) => b.progress - a.progress)
}

export async function unlockAchievement(
  userId: string,
  type:
    | "PRIMER_ENTRENAMIENTO"
    | "RACHA_7_DIAS"
    | "RACHA_30_DIAS"
    | "RETO_COMPLETADO"
    | "PESO_OBJETIVO_ALCANZADO",
  metadata?: Record<string, unknown>,
) {
  return prisma.achievement.create({
    data: {
      userId,
      type,
      description: metadata ? JSON.stringify(metadata) : null,
    },
  })
}

export async function getUserAchievements(userId: string) {
  return prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: "desc" },
  })
}
