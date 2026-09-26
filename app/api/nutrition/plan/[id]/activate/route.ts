import { NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { activatePlan } from "@/lib/nutrition/service"

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id } = await context.params

  try {
    const plan = await activatePlan(user.id, id)
    if (!plan) return apiError("Plan no encontrado", 404)
    return NextResponse.json({ ok: true, plan })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error activando plan"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
