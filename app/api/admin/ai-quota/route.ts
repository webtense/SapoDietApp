import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { adminAiQuotaSchema } from "@/lib/validation"

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const payload = await req.json().catch(() => null)
  const parsed = adminAiQuotaSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { userId, aiTokenLimit, resetUsage } = parsed.data

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(aiTokenLimit !== undefined ? { aiTokenLimit } : {}),
      ...(resetUsage ? { aiTokensUsed: 0, lastAiTokenReset: new Date() } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}
