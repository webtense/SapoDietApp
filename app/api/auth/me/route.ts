import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { getSessionUser } from "@/lib/server/security"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { modules: true, pricing: true },
  })

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: fullUser?.phone ?? null,
      timezone: fullUser?.timezone ?? null,
      role: user.role,
      status: user.status,
      modules: fullUser?.modules?.filter((m) => m.enabled).map((m) => m.moduleKey) ?? [],
      pricing: fullUser?.pricing
        ? {
            label: fullUser.pricing.label,
            monthlyPrice: fullUser.pricing.monthlyPrice,
            currency: fullUser.pricing.currency,
            notes: fullUser.pricing.notes,
          }
        : null,
    },
  })
}
