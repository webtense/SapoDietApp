import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/api"
import { getDashboardMetrics } from "@/lib/server/metrics"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const daysParam = Number(req.nextUrl.searchParams.get("days") || 30)
  const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30

  const metrics = await getDashboardMetrics(days)
  return NextResponse.json({ ok: true, metrics })
}
