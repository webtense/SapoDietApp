import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { getActivePlan } from "@/lib/nutrition/service"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  try {
    const plan = await getActivePlan(user.id)

    return NextResponse.json({ ok: true, plan })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error cargando plan"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
