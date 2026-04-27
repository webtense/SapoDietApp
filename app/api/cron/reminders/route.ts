import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { dispatchReminder, getReminderMoment, parseReminderDays } from "@/lib/server/reminders"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const reminders = await prisma.reminder.findMany({
    where: {
      enabled: true,
    },
    include: {
      user: true,
    },
  })

  const remindersToSend = reminders.filter((reminder) => {
    const local = getReminderMoment(now, reminder.user.timezone)
    return parseReminderDays(reminder.days).includes(local.day) && reminder.time === local.time
  })

  const results = await Promise.all(
    remindersToSend.map(async (reminder) => {
      const result = await dispatchReminder(reminder)
      return { id: reminder.id, title: reminder.title, ...result }
    })
  )

  return NextResponse.json({
    executedAt: now.toISOString(),
    remindersFound: reminders.length,
    remindersSent: remindersToSend.length,
    results,
  })
}
