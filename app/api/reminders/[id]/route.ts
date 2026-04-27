import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { parseReminderDays } from "@/lib/server/reminders"

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
      ...(body.days !== undefined && { days: JSON.stringify(Array.isArray(body.days) ? body.days.filter((item: unknown) => typeof item === "string") : []) }),
    },
  })

  return NextResponse.json({
    reminder: {
      id: updated.id,
      kind: updated.kind,
      system: updated.system,
      title: updated.title,
      time: updated.time,
      days: parseReminderDays(updated.days),
      enabled: updated.enabled,
      lastError: updated.lastError,
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

  if (reminder.system) {
    return apiError("No puedes eliminar un recordatorio automático", 400)
  }

  await prisma.reminder.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
