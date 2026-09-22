import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireUser } from "@/lib/server/api"
import { endSession } from "@/lib/training/service"
import { endWorkoutSessionSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = endWorkoutSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  try {
    const existing = await prisma.workoutSession.findUnique({
      where: { id: parsed.data.workoutSessionId },
    })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    }

    const session = await endSession(parsed.data.workoutSessionId, parsed.data.completionStatus)
    return NextResponse.json({ ok: true, session })
  } catch (err) {
    console.error("[workout/end]", err)
    return NextResponse.json({ error: "Error finalizando la sesión" }, { status: 500 })
  }
}
