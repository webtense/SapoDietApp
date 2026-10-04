import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { newsletterSubscribeSchema } from "@/lib/validation"
import { generateNewsletterToken, sendNewsletterConfirmationEmail } from "@/lib/server/newsletter"

const GENERIC_RESPONSE = { ok: true, message: "Revisa tu correo para confirmar tu suscripción" }

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"

  const rate = await checkRateLimit(`newsletter:subscribe:${ip}`, 3, 60 * 60 * 1000)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Inténtalo más tarde." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = newsletterSubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido o falta el consentimiento" }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })

  if (existing) {
    if (existing.status === "CONFIRMED") {
      // No revelar que ya existe: respuesta genérica, no se reenvía nada.
      return NextResponse.json(GENERIC_RESPONSE)
    }

    if (existing.status === "UNSUBSCRIBED") {
      // Baja permanente: no se readmite automáticamente.
      return NextResponse.json(GENERIC_RESPONSE)
    }

    // PENDING: reenviar confirmación con el mismo token.
    await sendNewsletterConfirmationEmail(existing.email, existing.token)
    await prisma.newsletterAuditLog.create({
      data: { subscriberId: existing.id, action: "SUBSCRIBED", metadata: { source: "landing", resend: true } },
    })
    return NextResponse.json(GENERIC_RESPONSE)
  }

  const token = generateNewsletterToken()
  const subscriber = await prisma.newsletterSubscriber.create({
    data: {
      email,
      token,
      source: "landing",
      consentAt: new Date(),
    },
  })

  await prisma.newsletterAuditLog.create({
    data: { subscriberId: subscriber.id, action: "SUBSCRIBED", metadata: { source: "landing" } },
  })

  await sendNewsletterConfirmationEmail(email, token)

  return NextResponse.json(GENERIC_RESPONSE)
}
