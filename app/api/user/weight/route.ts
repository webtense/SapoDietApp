import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyLogs = await prisma.dailyLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: thirtyDaysAgo,
        },
        weightKg: {
          not: null,
        },
      },
      select: {
        date: true,
        weightKg: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    const entries = dailyLogs.map((log) => ({
      date: log.date.toISOString().split('T')[0],
      weight: log.weightKg,
    }))

    return NextResponse.json({
      ok: true,
      entries,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error obteniendo peso"
    return NextResponse.json({ error: message, ok: false }, { status: 400 })
  }
}
