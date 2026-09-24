import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { getSessionUser } from "@/lib/server/security"
import { apiError, requireAdmin } from "@/lib/server/api"
import { VERSION_EVENTS } from "@/lib/analytics/version-tracker"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  let body: { event?: string; version?: string; oldVersion?: string; metadata?: unknown }
  try {
    body = await req.json()
  } catch {
    return apiError("JSON inválido")
  }

  if (!body.event || !VERSION_EVENTS.includes(body.event as (typeof VERSION_EVENTS)[number])) {
    return apiError("Evento no válido")
  }

  const user = await getSessionUser().catch(() => null)
  const metadata = body.metadata ? JSON.stringify(body.metadata).slice(0, 2000) : null

  await prisma.versionAnalytics.create({
    data: {
      event: body.event,
      version: body.version?.slice(0, 32) ?? null,
      oldVersion: body.oldVersion?.slice(0, 32) ?? null,
      userId: user?.id ?? null,
      metadata,
    },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "7", 10) || 7, 1), 90)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const rows = await prisma.versionAnalytics.findMany({
    where: { createdAt: { gte: since } },
    select: { event: true, version: true, userId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  const byEvent: Record<string, number> = {}
  for (const row of rows) byEvent[row.event] = (byEvent[row.event] ?? 0) + 1

  return NextResponse.json({ days, total: rows.length, byEvent })
}
