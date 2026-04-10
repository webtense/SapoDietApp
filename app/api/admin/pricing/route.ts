import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { adminUpdatePricingSchema } from "@/lib/validation"

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = adminUpdatePricingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  await prisma.userPricing.upsert({
    where: { userId: parsed.data.userId },
    update: {
      label: parsed.data.label,
      monthlyPrice: parsed.data.monthlyPrice,
      currency: parsed.data.currency ?? "EUR",
      notes: parsed.data.notes,
    },
    create: {
      userId: parsed.data.userId,
      label: parsed.data.label,
      monthlyPrice: parsed.data.monthlyPrice,
      currency: parsed.data.currency ?? "EUR",
      notes: parsed.data.notes,
    },
  })

  return NextResponse.json({ ok: true })
}
