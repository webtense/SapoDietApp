import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { newsletterSendSchema } from "@/lib/validation"
import { sendNewsletterCampaignEmail } from "@/lib/server/newsletter"

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const rate = await checkRateLimit(`newsletter:send:${user.id}`, 1, 60 * 60 * 1000)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Ya se envió una campaña en la última hora" }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = newsletterSendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Asunto o contenido inválido" }, { status: 400 })
  }

  const { subject, htmlBody } = parsed.data

  const recipients = await prisma.newsletterSubscriber.findMany({
    where: { status: "CONFIRMED" },
    select: { id: true, email: true, token: true },
  })

  let sent = 0
  const failedEmails: string[] = []

  for (const recipient of recipients) {
    const result = await sendNewsletterCampaignEmail(recipient.email, recipient.token, subject, htmlBody)

    if (result.success) {
      sent += 1
      await prisma.newsletterAuditLog.create({
        data: {
          subscriberId: recipient.id,
          action: "EMAIL_SENT",
          metadata: { subject, sentBy: user.id },
        },
      })
    } else {
      failedEmails.push(recipient.email)
    }
  }

  return NextResponse.json({ sent, failed: failedEmails.length, failedEmails })
}
