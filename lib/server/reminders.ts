import { prisma } from "@/lib/server/prisma"
import { sendPushToUser } from "@/lib/server/push"
import { evolutionSendText } from "@/lib/server/evolution"
import { checkRateLimit } from "@/lib/server/rate-limit"

export const DEFAULT_TIMEZONE = "Europe/Madrid"
export const DEFAULT_WORKOUT_TIME = "19:00"

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function parseReminderDays(value: string) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []
  } catch {
    return []
  }
}

export function getWorkoutDays(trainingFrequency?: string | null) {
  switch ((trainingFrequency || "").toLowerCase()) {
    case "1-2":
      return ["2", "4"]
    case "3-4":
      return ["1", "3", "5", "6"]
    case "5-6":
      return ["1", "2", "3", "4", "5", "6"]
    case "diario":
      return ["0", "1", "2", "3", "4", "5", "6"]
    default:
      return ["1", "3", "5"]
  }
}

function getWeekdayIndex(shortWeekday: string) {
  const normalized = shortWeekday.toLowerCase()
  if (normalized.startsWith("sun")) return "0"
  if (normalized.startsWith("mon")) return "1"
  if (normalized.startsWith("tue")) return "2"
  if (normalized.startsWith("wed")) return "3"
  if (normalized.startsWith("thu")) return "4"
  if (normalized.startsWith("fri")) return "5"
  return "6"
}

export function getReminderMoment(now: Date, timezone?: string | null) {
  const tz = timezone || DEFAULT_TIMEZONE
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now)

  const weekday = parts.find((part) => part.type === "weekday")?.value || "Mon"
  const hour = Number(parts.find((part) => part.type === "hour")?.value || "0")
  const minute = Number(parts.find((part) => part.type === "minute")?.value || "0")

  return {
    timezone: tz,
    day: getWeekdayIndex(weekday),
    time: `${pad(hour)}:${pad(minute)}`,
  }
}

export async function ensureWorkoutReminder(userId: string, trainingFrequency?: string | null) {
  const existing = await prisma.reminder.findFirst({
    where: { userId, kind: "WORKOUT" },
    select: { id: true, enabled: true, time: true },
  })

  const data = {
    title: "Entrenar",
    time: existing?.time || DEFAULT_WORKOUT_TIME,
    days: JSON.stringify(getWorkoutDays(trainingFrequency)),
    enabled: true,
    kind: "WORKOUT",
    system: true,
  }

  if (existing) {
    return prisma.reminder.update({
      where: { id: existing.id },
      data,
    })
  }

  return prisma.reminder.create({
    data: {
      userId,
      ...data,
    },
  })
}

function buildReminderMessage(title: string, isWorkout: boolean) {
  if (isWorkout) {
    return {
      title: "Hora de entrenar",
      body: `Toca tu sesión de hoy: ${title}. Abre SapoFit y márcala al terminar.`,
    }
  }

  return {
    title: "Recordatorio SapoFit",
    body: `Es el momento de: ${title}`,
  }
}

export async function dispatchReminder(reminder: {
  id: string
  title: string
  kind: string
  lastSentAt: Date | null
  user: { id: string; name: string | null; phone: string | null; phoneVerified: boolean; timezone: string | null }
}) {
  const now = new Date()
  if (reminder.lastSentAt && now.getTime() - reminder.lastSentAt.getTime() < 60_000) {
    return { skipped: true as const, reason: "deduped" }
  }

  const copy = buildReminderMessage(reminder.title, reminder.kind === "WORKOUT")
  const pushResult = await sendPushToUser(reminder.user.id, {
    title: copy.title,
    body: copy.body,
    url: reminder.kind === "WORKOUT" ? "/entrenamiento" : "/recordatorios",
  })

  let whatsappResult: any = null
  if (reminder.user.phone && reminder.user.phoneVerified) {
    const bucketDay = now.toISOString().slice(0, 10)
    const rate = await checkRateLimit(`wa:reminders:${reminder.user.id}:${bucketDay}`, 5, 86_400_000)
    if (rate.allowed) {
      whatsappResult = await evolutionSendText({
        userId: reminder.user.id,
        toPhone: reminder.user.phone,
        message: `${copy.title}\n\n${copy.body}`,
      }).catch((error: any) => ({ ok: false, error: error?.message || "EVOLUTION_SEND_FAILED" }))
    } else {
      whatsappResult = { ok: false, error: "WHATSAPP_RATE_LIMIT" }
    }
  }

  const failedPush = !pushResult.ok || pushResult.sent === 0
  const failedWhatsapp = whatsappResult && !whatsappResult.ok
  const lastError = [
    failedPush ? `push:${pushResult.ok ? "NO_SUBSCRIPTIONS" : pushResult.error}` : null,
    failedWhatsapp ? `whatsapp:${whatsappResult.error || whatsappResult.status || "failed"}` : null,
  ]
    .filter(Boolean)
    .join(" | ")

  await prisma.reminder.update({
    where: { id: reminder.id },
    data: {
      lastSentAt: now,
      lastError: lastError || null,
    },
  })

  return {
    skipped: false as const,
    push: pushResult,
    whatsapp: whatsappResult,
    lastError: lastError || null,
  }
}
