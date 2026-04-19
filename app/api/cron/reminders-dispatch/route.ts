import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { dispatchReminder, getReminderMoment, parseReminderDays } from "@/lib/server/reminders"

export async function POST(req: NextRequest) {
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
    where: { enabled: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          phoneVerified: true,
          timezone: true,
        },
      },
    },
  })

  const due = reminders.filter((reminder) => {
    const local = getReminderMoment(now, reminder.user.timezone)
    return parseReminderDays(reminder.days).includes(local.day) && reminder.time === local.time
  })

  const results = await Promise.all(
    due.map(async (reminder) => ({
      id: reminder.id,
      title: reminder.title,
      userId: reminder.user.id,
      kind: reminder.kind,
      result: await dispatchReminder(reminder),
    })),
  )

  return NextResponse.json({
    ok: true,
    executedAt: now.toISOString(),
    remindersFound: reminders.length,
    remindersDue: due.length,
    dispatched: results.filter((item) => !item.result.skipped).length,
    results,
  })
}
