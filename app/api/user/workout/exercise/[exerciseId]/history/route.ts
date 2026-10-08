import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { getExerciseHistory } from "@/lib/training/progression"

const VALID_RANGES = [30, 90, 365] as const

export async function GET(req: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { exerciseId } = await params
  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId requerido" }, { status: 400 })
  }

  const rangeParam = Number(req.nextUrl.searchParams.get("range"))
  const range = (VALID_RANGES as readonly number[]).includes(rangeParam)
    ? (rangeParam as 30 | 90 | 365)
    : 30

  try {
    const history = await getExerciseHistory(user.id, exerciseId, range)
    return NextResponse.json({ ok: true, range, ...history })
  } catch (err) {
    console.error("[workout/history]", err)
    return NextResponse.json({ error: "Error obteniendo el histórico" }, { status: 500 })
  }
}
