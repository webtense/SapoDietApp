import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { getOrCreateTodayWorkout } from "@/lib/training/service"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { searchParams } = new URL(req.url)
  const group = searchParams.get("group") as "UPPER" | "LOWER" | null

  if (!group || !["UPPER", "LOWER"].includes(group)) {
    return NextResponse.json(
      { error: "group must be UPPER or LOWER" },
      { status: 400 }
    )
  }

  try {
    const result = await getOrCreateTodayWorkout(user.id, group)

    if (result.needsGym) {
      return NextResponse.json({ ok: true, plan: null, needsGym: true })
    }

    return NextResponse.json({
      ok: true,
      needsGym: false,
      session: result.session,
      plan: result.plan,
      exercises: result.exercises,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error loading workout"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
