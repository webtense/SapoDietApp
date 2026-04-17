import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { evolutionSendSchema } from "@/lib/validation"
import { evolutionSendText } from "@/lib/server/evolution"
import { prisma } from "@/lib/server/prisma"

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = evolutionSendSchema.safeParse(body)
  if (!parsed.success) return apiError("Payload inválido")

  const toPhone = parsed.data.toPhone

  // Users can only message their own phone number.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true, phoneVerified: true, role: true },
  })

  if (!dbUser?.phone) return apiError("NO_PHONE", 400)
  if (!dbUser.phoneVerified) return apiError("PHONE_NOT_VERIFIED", 403)

  const to =
    dbUser.role === "ADMIN" && toPhone
      ? toPhone
      : dbUser.phone

  const result = await evolutionSendText({
    userId: user.id,
    toPhone: to,
    message: parsed.data.message,
    rawJson: JSON.stringify({ requestedToPhone: toPhone ?? null }),
  }).catch((e: any) => {
    const msg = typeof e?.message === "string" ? e.message : "EVOLUTION_SEND_FAILED"
    return { ok: false, status: 500, json: { error: msg } }
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
