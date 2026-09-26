import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { getActivePlan, updateHouseholdMember, deleteHouseholdMember } from "@/lib/nutrition/service"
import { prisma } from "@/lib/server/prisma"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().positive().nullable().optional(),
  portionFactor: z.number().positive().optional(),
})

async function assertOwnership(userId: string, memberId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { id: memberId },
    include: { plan: true },
  })
  if (!member || member.plan.userId !== userId) return null
  return member
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id } = await context.params
  const member = await assertOwnership(user.id, id)
  if (!member) return apiError("Comensal no encontrado", 404)

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return apiError("Datos inválidos")

  try {
    const updated = await updateHouseholdMember(id, parsed.data)
    return NextResponse.json({ ok: true, member: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error actualizando comensal"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id } = await context.params
  const member = await assertOwnership(user.id, id)
  if (!member) return apiError("Comensal no encontrado", 404)

  try {
    await deleteHouseholdMember(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error eliminando comensal"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
