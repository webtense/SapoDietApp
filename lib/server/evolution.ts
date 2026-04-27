import { prisma } from "@/lib/server/prisma"

function cleanPhone(input: string) {
  return input.replace(/[^\d+]/g, "")
}

function getEvolutionConfig() {
  // Backward-compatible with existing lowercase envs used in cron routes.
  const baseUrl =
    process.env.EVOLUTION_URL ||
    process.env.evolution_URL ||
    "http://127.0.0.1:8080"

  const apiKey = process.env.EVOLUTION_API_KEY || process.env.evolution_api || ""
  const instance = process.env.EVOLUTION_INSTANCE || process.env.evolution_movil || ""

  return { baseUrl, apiKey, instance }
}

export async function evolutionSendText(params: {
  userId: string
  toPhone: string
  message: string
  rawJson?: string
}) {
  const { baseUrl, apiKey, instance } = getEvolutionConfig()
  if (!apiKey) throw new Error("EVOLUTION_API_KEY_MISSING")
  if (!instance) throw new Error("EVOLUTION_INSTANCE_MISSING")

  const to = cleanPhone(params.toPhone)

  const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({ number: to, text: params.message }),
  })

  const json = await response.json().catch(() => null)
  const ok = response.ok && !!json

  await prisma.evolutionMsg.create({
    data: {
      userId: params.userId,
      platform: "whatsapp",
      direction: "sent",
      toPhone: to,
      content: params.message,
      rawJson: params.rawJson ?? (json ? JSON.stringify(json) : null),
    },
  })

  return { ok, status: response.status, json }
}

export async function evolutionStoreInbound(params: {
  fromPhone: string
  message: string
  rawJson?: string
}) {
  const from = cleanPhone(params.fromPhone)

  const user = await prisma.user.findFirst({
    where: {
      phone: from,
    },
    select: { id: true, phoneVerified: true },
  })

  if (user) {
    await prisma.evolutionMsg.create({
      data: {
        userId: user.id,
        platform: "whatsapp",
        direction: "received",
        fromPhone: from,
        content: params.message,
        rawJson: params.rawJson ?? null,
      },
    })
  }

  return { matchedUserId: user?.id ?? null, from }
}

export function parseEvolutionInboundPayload(body: any): { fromPhone: string; message: string } | null {
  if (body && typeof body.fromPhone === "string" && typeof body.message === "string") {
    return { fromPhone: body.fromPhone, message: body.message }
  }

  // Common Evolution/Baileys-like payload shapes
  const remoteJid = body?.data?.key?.remoteJid
  const conversation = body?.data?.message?.conversation
  const extendedText = body?.data?.message?.extendedTextMessage?.text
  const msg = typeof conversation === "string" ? conversation : typeof extendedText === "string" ? extendedText : null

  if (typeof remoteJid === "string" && typeof msg === "string") {
    // e.g. "34600111222@s.whatsapp.net"
    const fromPhone = remoteJid.split("@")[0]
    return { fromPhone, message: msg }
  }

  return null
}
