import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { getLastForExercise } from "@/lib/training/service"

export async function GET(_req: Request, { params }: { params: Promise<{ exerciseId: string }> }) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { exerciseId } = await params
  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId requerido" }, { status: 400 })
  }

  try {
    const last = await getLastForExercise(user.id, exerciseId)
    return NextResponse.json({ ok: true, last })
  } catch (err) {
    console.error("[workout/last]", err)
    return NextResponse.json({ error: "Error obteniendo el último registro" }, { status: 500 })
  }
}
