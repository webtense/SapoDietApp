"use client"

// Sincronización de salud desde la app Android (Capacitor + Health Connect).
//
// Esta capa SOLO hace algo dentro del WebView nativo (Capacitor.isNativePlatform()).
// En la web normal (navegador, PWA iOS) todas las funciones son no-op seguras:
// la importación de datos de salud allí sigue el camino de la Fase 2 (Atajos de
// iOS -> POST /api/import/health con token Bearer).
//
// Plugin de comunidad usado: "capacitor-health" (mley/capacitor-health), que
// cubre tanto Apple Health como Google Health Connect con la misma interfaz.
// Aquí solo se usa su lado Android (Health Connect); en iOS esta app no se
// instala como nativa, así que esas llamadas nunca se ejecutan ahí.

import { Capacitor } from "@capacitor/core"
import { Health, type HealthPermission } from "capacitor-health"

const SYNC_DAYS = 7
const REQUIRED_PERMISSIONS: HealthPermission[] = [
  "READ_STEPS",
  "READ_HEART_RATE",
  "READ_ACTIVE_CALORIES",
  "READ_WEIGHT",
  "READ_WORKOUTS",
]

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
  } catch {
    return false
  }
}

export interface SyncResult {
  ok: boolean
  reason?: "not-native" | "unavailable" | "permission-denied" | "network-error"
  daysSynced?: number
}

async function ensurePermissions(): Promise<boolean> {
  const { available } = await Health.isHealthAvailable()
  if (!available) return false

  const existing = await Health.checkHealthPermissions({ permissions: REQUIRED_PERMISSIONS })
  const missing = REQUIRED_PERMISSIONS.filter((p) => !existing.permissions.some((entry) => entry[p]))
  if (missing.length === 0) return true

  const granted = await Health.requestHealthPermissions({ permissions: REQUIRED_PERMISSIONS })
  // iOS no informa de denegaciones reales; en Android confiamos en la respuesta.
  return REQUIRED_PERMISSIONS.every((p) => granted.permissions.some((entry) => entry[p]))
}

function dayBounds(daysAgo: number) {
  const end = new Date()
  end.setUTCHours(0, 0, 0, 0)
  end.setUTCDate(end.getUTCDate() - daysAgo + 1)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 1)
  return { start, end }
}

/**
 * Lee pasos/pulso/peso/entrenos de los últimos SYNC_DAYS días de Health Connect
 * y los envía día a día a POST /api/user/health (autenticado por sesión).
 */
export async function syncHealthFromDevice(): Promise<SyncResult> {
  if (!isNativeAndroid()) return { ok: false, reason: "not-native" }

  const hasPermissions = await ensurePermissions().catch(() => false)
  if (!hasPermissions) return { ok: false, reason: "permission-denied" }

  const since = new Date()
  since.setUTCDate(since.getUTCDate() - SYNC_DAYS)
  const now = new Date()

  const [stepsAgg, weightRecords, workoutsResp] = await Promise.all([
    Health.queryAggregated({
      startDate: since.toISOString(),
      endDate: now.toISOString(),
      dataType: "steps",
      bucket: "day",
    }),
    Health.queryRecords({
      startDate: since.toISOString(),
      endDate: now.toISOString(),
      dataType: "weight",
    }),
    Health.queryWorkouts({
      startDate: since.toISOString(),
      endDate: now.toISOString(),
      includeHeartRate: true,
      includeRoute: false,
      includeSteps: false,
    }),
  ])

  let daysSynced = 0
  for (let i = 0; i < SYNC_DAYS; i++) {
    const { start, end } = dayBounds(i)
    const stepsBucket = stepsAgg.aggregatedData.find(
      (b) => new Date(b.startDate).getTime() === start.getTime(),
    )
    const weightOfDay = weightRecords.records
      .filter((r) => {
        const t = new Date(r.startDate).getTime()
        return t >= start.getTime() && t < end.getTime()
      })
      .at(-1)
    const workoutsOfDay = workoutsResp.workouts
      .filter((w) => {
        const t = new Date(w.startDate).getTime()
        return t >= start.getTime() && t < end.getTime()
      })
      .slice(0, 20)
      .map((w) => ({
        startedAt: w.startDate,
        endedAt: w.endDate,
        type: w.workoutType,
        kcal: w.calories,
        avgHr: w.heartRate?.length
          ? Math.round(w.heartRate.reduce((sum, hr) => sum + hr.bpm, 0) / w.heartRate.length)
          : undefined,
        externalId: w.id ?? `${w.sourceBundleId}-${w.startDate}`,
      }))

    const steps = stepsBucket ? Math.round(stepsBucket.value) : undefined
    const weightKg = weightOfDay ? weightOfDay.value : undefined
    if (steps === undefined && weightKg === undefined && workoutsOfDay.length === 0) continue

    const payload = {
      date: start.toISOString(),
      steps,
      weightKg,
      workouts: workoutsOfDay.length ? workoutsOfDay : undefined,
    }

    try {
      const res = await fetch("/api/user/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) daysSynced++
    } catch {
      return { ok: false, reason: "network-error", daysSynced }
    }
  }

  return { ok: true, daysSynced }
}
