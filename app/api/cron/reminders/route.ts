import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { sendReminderEmail } from "@/lib/server/email"

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
  const currentDay = now.getDay().toString()
  const currentTime = now.toTimeString().slice(0, 5)

  const reminders = await prisma.reminder.findMany({
    where: {
      enabled: true,
    },
    include: {
      user: true,
    },
  })

  const remindersToSend = reminders.filter((reminder) => {
    const days = JSON.parse(reminder.days) as string[]
    return days.includes(currentDay) && reminder.time === currentTime
  })

  const results = await Promise.all(
    remindersToSend.map(async (reminder) => {
      try {
        const result = await sendReminderEmail(
          reminder.user.email,
          reminder.user.name || "Usuario",
          reminder.title,
          reminder.time,
        )
        return { id: reminder.id, title: reminder.title, ...result }
      } catch (error) {
        return { id: reminder.id, title: reminder.title, success: false, error }
      }
    })
  )

  return NextResponse.json({
    executedAt: now.toISOString(),
    remindersFound: reminders.length,
    remindersSent: remindersToSend.length,
    results,
  })
}
