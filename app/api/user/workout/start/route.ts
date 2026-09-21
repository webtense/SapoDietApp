import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { startSession } from "@/lib/training/service"
import { startWorkoutSessionSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = startWorkoutSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  try {
    const session = await startSession(user.id, {
      mode: parsed.data.mode,
      workoutPlanId: parsed.data.workoutPlanId,
    })
    return NextResponse.json({ ok: true, session })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error iniciando la sesión"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
