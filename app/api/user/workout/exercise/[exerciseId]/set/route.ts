import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { recordSet } from "@/lib/training/service"
import { recordWorkoutSetSchema } from "@/lib/validation"

export async function POST(req: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { exerciseId } = await params
  const body = await req.json().catch(() => null)
  const parsed = recordWorkoutSetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  if (parsed.data.workoutExerciseId !== exerciseId) {
    return NextResponse.json({ error: "El ejercicio no coincide con la ruta" }, { status: 400 })
  }

  try {
    const set = await recordSet({
      userId: user.id,
      workoutSessionId: parsed.data.workoutSessionId,
      workoutExerciseId: parsed.data.workoutExerciseId,
      setNumber: parsed.data.setNumber,
      weight: parsed.data.weight,
      reps: parsed.data.reps,
      rir: parsed.data.rir,
      rpe: parsed.data.rpe,
      completed: parsed.data.completed,
      skipped: parsed.data.skipped,
    })
    return NextResponse.json({ ok: true, set })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error registrando la serie"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
