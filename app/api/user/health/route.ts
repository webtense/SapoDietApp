import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"
import { healthImportSchema } from "@/lib/validation"
import { importHealthData } from "@/lib/server/health-import"

/**
 * Entrada de datos de salud autenticada por sesión: app Android (Capacitor +
 * Health Connect) y entrada manual desde la web.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = healthImportSchema.safeParse(body)
  if (!parsed.success) {
    return apiError("Datos de salud inválidos", 400)
  }

  const result = await importHealthData(user.id, parsed.data, "manual")
  return NextResponse.json(result)
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get("days") ?? 30)
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - (Number.isFinite(days) && days > 0 ? days : 30))

  const [dailies, lastToken] = await Promise.all([
    prisma.healthDaily.findMany({
      where: { userId: user.id, date: { gte: since } },
      orderBy: { date: "asc" },
      take: 400,
    }),
    prisma.healthToken.findFirst({
      where: { userId: user.id, revokedAt: null },
      orderBy: { lastUsedAt: "desc" },
    }),
  ])

  return NextResponse.json({
    dailies,
    lastSyncAt: lastToken?.lastUsedAt ?? null,
  })
}
