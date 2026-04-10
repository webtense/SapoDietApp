import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => null)

  const reminder = await prisma.reminder.findFirst({
    where: { id, userId: user.id },
  })

  if (!reminder) {
    return apiError("Recordatorio no encontrado")
  }

  const updated = await prisma.reminder.update({
    where: { id },
    data: {
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.title !== undefined && { title: body.title.slice(0, 100) }),
      ...(body.time !== undefined && { time: body.time }),
      ...(body.days !== undefined && { days: JSON.stringify(body.days) }),
    },
  })

  return NextResponse.json({
    reminder: {
      id: updated.id,
      title: updated.title,
      time: updated.time,
      days: JSON.parse(updated.days),
      enabled: updated.enabled,
    },
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser()
  if (error) return error

  const { id } = await params

  const reminder = await prisma.reminder.findFirst({
    where: { id, userId: user.id },
  })

  if (!reminder) {
    return apiError("Recordatorio no encontrado")
  }

  await prisma.reminder.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}