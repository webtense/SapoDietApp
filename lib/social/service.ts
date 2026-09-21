import { prisma } from "@/lib/server/prisma"

export async function refreshChallengeProgress(challengeId: string) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) throw new Error("Reto no encontrado")

  const participants = await prisma.userChallenge.findMany({ where: { challengeId } })

  for (const participant of participants) {
    let progreso = 0

    if (challenge.tipo === "ENTRENAMIENTOS_SEMANA" || challenge.tipo === "RACHA_DIAS") {
      progreso = await prisma.workoutSession.count({
        where: {
          userId: participant.userId,
          sessionType: "PLANNED",
          completionStatus: "COMPLETED",
          createdAt: { gte: challenge.fechaInicio, lte: challenge.fechaFin },
        },
      })
    } else if (challenge.tipo === "MINUTOS_ACTIVOS") {
      const sessions = await prisma.workoutSession.findMany({
        where: {
          userId: participant.userId,
          completionStatus: "COMPLETED",
          startTime: { not: null },
          endTime: { not: null },
          createdAt: { gte: challenge.fechaInicio, lte: challenge.fechaFin },
        },
        select: { startTime: true, endTime: true },
      })
      const minutos = sessions.reduce((total, s) => {
        if (!s.startTime || !s.endTime) return total
        return total + (s.endTime.getTime() - s.startTime.getTime()) / 60000
      }, 0)
      progreso = Math.round(minutos)
    } else if (challenge.tipo === "VOLUMEN_TOTAL") {
      // TODO: pendiente de definir cómo se calcula el volumen total agregado
      // por usuario dentro de la ventana del reto (requiere sumar sets de
      // todas las sesiones). No bloqueante para el resto del módulo social.
      continue
    }

    const completado = progreso >= challenge.objetivo
    await prisma.userChallenge.update({
      where: { id: participant.id },
      data: { progreso, completado },
    })

    if (completado && !participant.completado) {
      await unlockAchievement(participant.userId, "RETO_COMPLETADO", { challengeId })
    }
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
      progreso: p.progreso,
      objetivo: challenge.objetivo,
      completado: p.completado,
      ratio: challenge.objetivo > 0 ? Math.min(1, p.progreso / challenge.objetivo) : 0,
    }))
    .sort((a, b) => b.ratio - a.ratio)
}

export async function unlockAchievement(
  userId: string,
  tipo:
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
      tipo,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })
}

export async function getUserAchievements(userId: string) {
  return prisma.achievement.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}
