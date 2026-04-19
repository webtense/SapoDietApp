import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { dispatchReminder, getReminderMoment, parseReminderDays } from "@/lib/server/reminders"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const reminders = await prisma.reminder.findMany({
    where: { enabled: true },
    include: {
      user: {
        select: { id: true, name: true, phone: true, phoneVerified: true, timezone: true }
      }
    },
  })

  const remindersToSend = reminders.filter((r) => {
    const local = getReminderMoment(now, r.user.timezone)
    return parseReminderDays(r.days).includes(local.day) && r.time === local.time && r.user.phone
  })

  const results = await Promise.all(
    remindersToSend.map(async (reminder) => {
      const result = await dispatchReminder(reminder)

      return {
        id: reminder.id,
        title: reminder.title,
        userId: reminder.user.id,
        phone: reminder.user.phone,
        success: !result.skipped,
        result,
      }
    })
  )

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json({
    executedAt: now.toISOString(),
    total: results.length,
    sent: successful,
    failed,
    results,
  })
}
