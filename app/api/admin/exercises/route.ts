import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { adminCreateExerciseSchema } from "@/lib/validation"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
    include: { muscleGroup: true },
  })

  return NextResponse.json({ ok: true, exercises })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = adminCreateExerciseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  try {
    const exercise = await prisma.exercise.create({ data: parsed.data })
    return NextResponse.json({ ok: true, exercise })
  } catch (err) {
    console.error("[admin/exercises]", err)
    return NextResponse.json({ error: "Error creando el ejercicio" }, { status: 500 })
  }
}
