import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/server/prisma"
import { requireUser } from "@/lib/server/api"

const GROUPS = ["UPPER", "LOWER", "FULL", "REST"] as const

const dayInputSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  group: z.enum(GROUPS),
  label: z.string().trim().max(60).optional().nullable(),
})

const putSchema = z.array(dayInputSchema).length(7)

export async function GET() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const schedules = await prisma.workoutSchedule.findMany({
    where: { userId: user.id },
    orderBy: { weekday: "asc" },
  })

  const byWeekday = new Map(schedules.map((s) => [s.weekday, s]))
  const days = Array.from({ length: 7 }, (_, weekday) => {
    const existing = byWeekday.get(weekday)
    return (
      existing ?? {
        id: null,
        userId: user.id,
        weekday,
        group: "REST" as const,
        label: null,
        enabled: true,
      }
    )
  })

  return NextResponse.json({ ok: true, days })
}

export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  const results = await prisma.$transaction(
    parsed.data.map((day) =>
      prisma.workoutSchedule.upsert({
        where: { userId_weekday: { userId: user.id, weekday: day.weekday } },
        create: {
          userId: user.id,
          weekday: day.weekday,
          group: day.group,
          label: day.label?.trim() || null,
        },
        update: {
          group: day.group,
          label: day.label?.trim() || null,
        },
      }),
    ),
  )

  return NextResponse.json({ ok: true, days: results.sort((a, b) => a.weekday - b.weekday) })
}
