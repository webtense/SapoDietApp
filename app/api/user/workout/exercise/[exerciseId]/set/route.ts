import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { upsertSet } from "@/lib/training/service"
import { z } from "zod"

const setSchema = z.object({
  workoutSessionId: z.string(),
  setNumber: z.number().int().min(1),
  weight: z.number().positive(),
  reps: z.number().int().min(1).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { exerciseId } = await params
  const body = await req.json().catch(() => null)
  const parsed = setSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  try {
    const set = await upsertSet(user.id, {
      workoutSessionId: parsed.data.workoutSessionId,
      workoutExerciseId: exerciseId,
      setNumber: parsed.data.setNumber,
      weight: parsed.data.weight,
      reps: parsed.data.reps,
    })

    return NextResponse.json({ ok: true, set }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error saving set"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
