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
    const { session, plan, exercises } = await getOrCreateTodayWorkout(
      user.id,
      group
    )

    return NextResponse.json({
      ok: true,
      session,
      plan,
      exercises,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error loading workout"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
