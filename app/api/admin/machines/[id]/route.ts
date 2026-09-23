import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { z } from "zod"

const updateMachineSchema = z.object({
  name: z.string().optional(),
  group: z.enum(["UPPER", "LOWER", "FULL"]).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  tips: z.string().optional(),
  recommendedWeight: z.number().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = updateMachineSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  try {
    const machine = await prisma.machineModel.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ ok: true, machine })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error updating machine"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const { id } = await params

  try {
    await prisma.machineModel.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error deleting machine"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
