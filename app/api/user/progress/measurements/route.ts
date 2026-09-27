import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"

// El modelo real BodyMeasurement guarda UNA medida (bodyPart + measurement) por fila,
// no un objeto con varias medidas a la vez. Aquí usamos el nombre del campo (waistCm,
// chestCm, ...) como valor de `bodyPart` y agrupamos por día al leer, para mantener el
// mismo contrato que espera la pantalla de progreso (un objeto por fecha con todas las
// medidas de ese día).
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

function dayRange(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const rows = await prisma.bodyMeasurement.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    take: 5000,
  })

  const byDay = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10)
    const entry = byDay.get(key) ?? { date: row.date.toISOString(), notes: row.notes }
    if ((NUMERIC_FIELDS as readonly string[]).includes(row.bodyPart)) {
      entry[row.bodyPart] = row.measurement
    }
    if (row.notes) entry.notes = row.notes
    byDay.set(key, entry)
  }

  return NextResponse.json({ entries: Array.from(byDay.values()).slice(-500) })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || !body.date) return apiError("Datos de medidas inválidos")

  const date = new Date(body.date)
  if (Number.isNaN(date.getTime())) return apiError("Fecha inválida")

  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null
  const { start, end } = dayRange(date)

  const result: Record<string, unknown> = { date: date.toISOString(), notes }

  for (const field of NUMERIC_FIELDS) {
    if (typeof body[field] !== "number") continue

    const existing = await prisma.bodyMeasurement.findFirst({
      where: { userId: user.id, bodyPart: field, date: { gte: start, lt: end } },
    })

    const row = existing
      ? await prisma.bodyMeasurement.update({
          where: { id: existing.id },
          data: { measurement: body[field], notes },
        })
      : await prisma.bodyMeasurement.create({
          data: { userId: user.id, bodyPart: field, measurement: body[field], date, notes },
        })

    result[field] = row.measurement
  }

  return NextResponse.json({ entry: result })
}
