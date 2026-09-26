import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { addHouseholdMember, getActivePlan, getHouseholdMembers } from "@/lib/nutrition/service"
import { z } from "zod"

const householdSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  portionFactor: z.number().positive().optional(),
})

export async function GET() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const plan = await getActivePlan(user.id)
  if (!plan) return apiError("No tienes un plan nutricional activo", 404)

  try {
    const members = await getHouseholdMembers(plan.id)
    return NextResponse.json({ ok: true, members })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error cargando comensales"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const plan = await getActivePlan(user.id)
  if (!plan) return apiError("No tienes un plan nutricional activo", 404)

  const body = await req.json().catch(() => null)
  const parsed = householdSchema.safeParse(body)
  if (!parsed.success) return apiError("Datos de comensal inválidos")

  try {
    const member = await addHouseholdMember(
      plan.id,
      parsed.data.name,
      parsed.data.age,
      parsed.data.portionFactor ?? 1.0
    )
    return NextResponse.json({ ok: true, member }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error creando comensal"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
