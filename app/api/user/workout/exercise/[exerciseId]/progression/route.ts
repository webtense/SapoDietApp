import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { getExerciseProgression } from "@/lib/training/progression"

export async function GET(req: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { exerciseId } = await params
  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId requerido" }, { status: 400 })
  }

  const limitParam = req.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : 20

  try {
    const progression = await getExerciseProgression(user.id, exerciseId, Number.isFinite(limit) && limit > 0 ? limit : 20)
    return NextResponse.json({ ok: true, progression })
  } catch (err) {
    console.error("[workout/progression]", err)
    return NextResponse.json({ error: "Error obteniendo la progresión" }, { status: 500 })
  }
}
