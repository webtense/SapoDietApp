import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"
import { getWeightMovingAverage } from "@/lib/training/progression"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get("days") ?? 90)

  const [entries, movingAverage] = await Promise.all([
    prisma.weightEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      take: 500,
    }),
    getWeightMovingAverage(user.id, Number.isFinite(days) && days > 0 ? days : 90),
  ])

  return NextResponse.json({ entries, movingAverage })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || typeof body.weightKg !== "number" || !body.date) {
    return apiError("Datos de peso inválidos")
  }

  const date = new Date(body.date)
  if (Number.isNaN(date.getTime())) return apiError("Fecha inválida")

  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const existing = await prisma.weightEntry.findFirst({
    where: { userId: user.id, date: { gte: dayStart, lt: dayEnd } },
  })

  const entry = existing
    ? await prisma.weightEntry.update({
        where: { id: existing.id },
        data: { weight: body.weightKg, date },
      })
    : await prisma.weightEntry.create({
        data: { userId: user.id, date, weight: body.weightKg },
      })

  return NextResponse.json({ entry })
}
