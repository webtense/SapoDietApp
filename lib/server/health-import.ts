import { createHash, randomBytes } from "crypto"
import { prisma } from "@/lib/server/prisma"
import { healthImportSchema } from "@/lib/validation"

export type HealthImportPayload = ReturnType<typeof healthImportSchema["parse"]>

export interface HealthImportResult {
  ok: true
  date: string
  dailyUpserted: boolean
  weightUpserted: boolean
  workoutsImported: number
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function generateHealthToken() {
  return randomBytes(32).toString("hex")
}

/** Límites de día en UTC, igual que /api/user/progress/weight, para no repetir el desfase de zona. */
function utcDayRange(date: Date) {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayEnd = new Date(dayStart)
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
  return { dayStart, dayEnd }
}

/**
 * Servicio único de importación de datos de salud (pasos, pulso, sueño, peso, entrenos).
 * Usado tanto por /api/import/health (token Bearer, Atajos de iOS) como por
 * /api/user/health (sesión, Android + entrada manual). Idempotente: reimportar
 * el mismo día o el mismo entreno (userId+source+externalId) actualiza en vez de duplicar.
 */
export async function importHealthData(
  userId: string,
  payload: HealthImportPayload,
  source: string,
): Promise<HealthImportResult> {
  const date = new Date(payload.date)
  const { dayStart, dayEnd } = utcDayRange(date)

  let dailyUpserted = false
  if (
    payload.steps !== undefined ||
    payload.activeKcal !== undefined ||
    payload.restingHr !== undefined ||
    payload.avgHr !== undefined ||
    payload.sleepMin !== undefined
  ) {
    await prisma.healthDaily.upsert({
      where: { userId_date: { userId, date: dayStart } },
      create: {
        userId,
        date: dayStart,
        steps: payload.steps,
        activeKcal: payload.activeKcal,
        restingHr: payload.restingHr,
        avgHr: payload.avgHr,
        sleepMin: payload.sleepMin,
        source,
      },
      update: {
        steps: payload.steps,
        activeKcal: payload.activeKcal,
        restingHr: payload.restingHr,
        avgHr: payload.avgHr,
        sleepMin: payload.sleepMin,
        source,
      },
    })
    dailyUpserted = true
  }

  let weightUpserted = false
  if (payload.weightKg !== undefined) {
    const existing = await prisma.weightEntry.findFirst({
      where: { userId, date: { gte: dayStart, lt: dayEnd } },
    })

    if (existing) {
      await prisma.weightEntry.update({
        where: { id: existing.id },
        data: { weight: payload.weightKg, date },
      })
    } else {
      await prisma.weightEntry.create({
        data: { userId, date, weight: payload.weightKg },
      })
    }

    const existingLog = await prisma.dailyLog.findFirst({
      where: { userId, date: { gte: dayStart, lt: dayEnd } },
    })
    if (existingLog) {
      await prisma.dailyLog.update({
        where: { id: existingLog.id },
        data: { weightKg: payload.weightKg },
      })
    } else {
      await prisma.dailyLog.create({
        data: { userId, date: dayStart, weightKg: payload.weightKg },
      })
    }

    weightUpserted = true
  }

  let workoutsImported = 0
  for (const workout of payload.workouts ?? []) {
    await prisma.healthWorkout.upsert({
      where: {
        userId_source_externalId: { userId, source, externalId: workout.externalId },
      },
      create: {
        userId,
        startedAt: new Date(workout.startedAt),
        endedAt: workout.endedAt ? new Date(workout.endedAt) : null,
        type: workout.type,
        kcal: workout.kcal,
        avgHr: workout.avgHr,
        source,
        externalId: workout.externalId,
      },
      update: {
        startedAt: new Date(workout.startedAt),
        endedAt: workout.endedAt ? new Date(workout.endedAt) : null,
        type: workout.type,
        kcal: workout.kcal,
        avgHr: workout.avgHr,
      },
    })
    workoutsImported += 1
  }

  return {
    ok: true,
    date: dayStart.toISOString(),
    dailyUpserted,
    weightUpserted,
    workoutsImported,
  }
}

export interface HealthTokenAuth {
  userId: string
  tokenId: string
}

/** Valida un token Bearer de salud: hashea, busca por hash, exige no revocado. Actualiza lastUsedAt. */
export async function verifyHealthToken(rawToken: string): Promise<HealthTokenAuth | null> {
  const tokenHash = hashToken(rawToken)
  const token = await prisma.healthToken.findUnique({ where: { tokenHash } })
  if (!token || token.revokedAt) return null

  await prisma.healthToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  })

  return { userId: token.userId, tokenId: token.id }
}

export async function createHealthToken(userId: string, label: string) {
  const raw = generateHealthToken()
  const tokenHash = hashToken(raw)
  const token = await prisma.healthToken.create({
    data: { userId, label, tokenHash },
  })
  return { raw, token }
}

export async function revokeHealthToken(userId: string, tokenId: string) {
  const token = await prisma.healthToken.findUnique({ where: { id: tokenId } })
  if (!token || token.userId !== userId) return false
  await prisma.healthToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  })
  return true
}
