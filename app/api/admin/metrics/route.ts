import { requireAdmin } from '@/lib/server/api'
import { getDashboardMetrics } from '@/lib/server/metrics'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error || !admin) return error

  const days = Number(req.nextUrl.searchParams.get('days')) || 30
  const metrics = await getDashboardMetrics(days)

  return NextResponse.json({
    ok: true,
    metrics,
  })
}
