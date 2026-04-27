import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/server/api"
import { evolutionReceiveSchema } from "@/lib/validation"
import { evolutionStoreInbound, parseEvolutionInboundPayload } from "@/lib/server/evolution"
import { prisma } from "@/lib/server/prisma"

export async function POST(req: NextRequest) {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = evolutionReceiveSchema.safeParse(body)

  const inbound = parsed.success
    ? { fromPhone: parsed.data.fromPhone, message: parsed.data.message }
    : parseEvolutionInboundPayload(body)

  if (!inbound) return apiError("Payload inválido", 400)

  const stored = await evolutionStoreInbound({
    fromPhone: inbound.fromPhone,
    message: inbound.message,
    rawJson: body ? JSON.stringify(body) : undefined,
  })

  // Optionally verify phone on first trusted inbound message.
  if (secret && stored.matchedUserId) {
    await prisma.user.update({
      where: { id: stored.matchedUserId },
      data: { phoneVerified: true },
    })
  }

  return NextResponse.json({ ok: true, ...stored })
}
