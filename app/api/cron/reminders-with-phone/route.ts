import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const currentDay = now.getDay().toString()
  const currentTime = now.toTimeString().slice(0, 5)

  const reminders = await prisma.reminder.findMany({
    where: { enabled: true },
    include: {
      user: {
        select: { id: true, name: true, phone: true }
      }
    },
  })

  const remindersToSend = reminders
    .filter((r) => {
      const days = JSON.parse(r.days) as string[]
      return days.includes(currentDay) && r.time === currentTime && r.user.phone
    })
    .map((r) => ({
      id: r.id,
      title: r.title,
      time: r.time,
      user: {
        id: r.user.id,
        name: r.user.name,
        phone: r.user.phone,
      },
    }))

  return NextResponse.json({
    executedAt: now.toISOString(),
    remindersCount: remindersToSend.length,
    reminders: remindersToSend,
  })
}