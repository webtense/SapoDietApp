import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const reminders = await prisma.reminder.findMany({
    where: { userId: user.id },
    orderBy: { time: "asc" },
  })

  return NextResponse.json({
    reminders: reminders.map(r => ({
      id: r.id,
      title: r.title,
      time: r.time,
      days: JSON.parse(r.days),
      enabled: r.enabled,
    })),
  })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body?.title || !body?.time) {
    return apiError("Faltan datos del recordatorio")
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId: user.id,
      title: body.title.slice(0, 100),
      time: body.time,
      days: JSON.stringify(body.days || ["1", "2", "3", "4", "5"]),
      enabled: true,
    },
  })

  return NextResponse.json({
    reminder: {
      id: reminder.id,
      title: reminder.title,
      time: reminder.time,
      days: JSON.parse(reminder.days),
      enabled: reminder.enabled,
    },
  })
}