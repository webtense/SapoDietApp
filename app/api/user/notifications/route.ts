import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const limitParam = Number(req.nextUrl.searchParams.get("limit") || "10")
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 10

  const logs = await prisma.notificationLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return NextResponse.json({
    notifications: logs.map((log) => ({
      id: log.id,
      channel: log.channel,
      title: log.title,
      body: log.body,
      status: log.status,
      error: log.error,
      seenAt: log.seenAt,
      createdAt: log.createdAt,
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body?.id) {
    return NextResponse.json({ error: "Falta el id de la notificación" }, { status: 400 })
  }

  const log = await prisma.notificationLog.findFirst({
    where: { id: body.id, userId: user.id },
  })
  if (!log) {
    return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 })
  }

  await prisma.notificationLog.update({
    where: { id: log.id },
    data: { seenAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
