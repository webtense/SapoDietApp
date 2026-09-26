import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { z } from "zod"

const updateGymSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  location: z.string().max(200).nullable().optional(),
  isPublic: z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id } = await params

  const gym = await prisma.gym.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      machines: {
        include: { machineModel: true, weightOptions: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!gym) {
    return NextResponse.json({ error: "Gimnasio no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, gym })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id } = await params

  const gym = await prisma.gym.findUnique({ where: { id } })
  if (!gym) {
    return NextResponse.json({ error: "Gimnasio no encontrado" }, { status: 404 })
  }
  if (gym.createdById !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = updateGymSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const updated = await prisma.gym.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({ ok: true, gym: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id } = await params

  const gym = await prisma.gym.findUnique({ where: { id } })
  if (!gym) {
    return NextResponse.json({ error: "Gimnasio no encontrado" }, { status: 404 })
  }
  if (gym.createdById !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  await prisma.$transaction([
    prisma.profile.updateMany({ where: { gymId: id }, data: { gymId: null } }),
    prisma.gym.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
