import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"

const NUMERIC_FIELDS = [
  "waistCm",
  "chestCm",
  "hipsCm",
  "leftArmCm",
  "rightArmCm",
  "leftThighCm",
  "rightThighCm",
  "neckCm",
  "leftCalfCm",
  "rightCalfCm",
] as const

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const entries = await prisma.bodyMeasurement.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    take: 500,
  })

  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || !body.date) return apiError("Datos de medidas inválidos")

  const date = new Date(body.date)
  if (Number.isNaN(date.getTime())) return apiError("Fecha inválida")

  const values: Record<string, number | null> = {}
  for (const field of NUMERIC_FIELDS) {
    values[field] = typeof body[field] === "number" ? body[field] : null
  }
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null

  const entry = await prisma.bodyMeasurement.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, notes, ...values },
    update: { notes, ...values },
  })

  return NextResponse.json({ entry })
}
