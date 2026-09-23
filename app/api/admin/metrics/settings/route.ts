import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, apiError } from "@/lib/server/api"
import { getMonthlyAdSpend, setMonthlyAdSpend } from "@/lib/server/metrics"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const monthlyAdSpend = await getMonthlyAdSpend()
  return NextResponse.json({ ok: true, settings: { monthlyAdSpend } })
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return apiError("Cuerpo inválido")

  const value = Number(body.monthlyAdSpend)
  if (!Number.isFinite(value) || value < 0) return apiError("Importe inválido")

  await setMonthlyAdSpend(value)
  return NextResponse.json({ ok: true })
}
