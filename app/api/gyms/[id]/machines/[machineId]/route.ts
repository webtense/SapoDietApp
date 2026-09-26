import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { z } from "zod"

const updateMachineSchema = z.object({
  active: z.boolean().optional(),
  assetNumber: z.string().max(60).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

async function assertOwner(gymId: string, userId: string) {
  const gym = await prisma.gym.findUnique({ where: { id: gymId } })
  if (!gym) return { ok: false as const, response: NextResponse.json({ error: "Gimnasio no encontrado" }, { status: 404 }) }
  if (gym.createdById !== userId) {
    return { ok: false as const, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; machineId: string }> }
) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id, machineId } = await params

  const owner = await assertOwner(id, user.id)
  if (!owner.ok) return owner.response

  const machine = await prisma.gymMachine.findFirst({ where: { id: machineId, gymId: id } })
  if (!machine) {
    return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = updateMachineSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const updated = await prisma.gymMachine.update({
    where: { id: machineId },
    data: parsed.data,
    include: { machineModel: true },
  })

  return NextResponse.json({ ok: true, machine: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; machineId: string }> }
) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id, machineId } = await params

  const owner = await assertOwner(id, user.id)
  if (!owner.ok) return owner.response

  const machine = await prisma.gymMachine.findFirst({ where: { id: machineId, gymId: id } })
  if (!machine) {
    return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 })
  }

  await prisma.gymMachine.delete({ where: { id: machineId } })

  return NextResponse.json({ ok: true })
}
