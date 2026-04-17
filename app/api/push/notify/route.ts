import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { prisma } from "@/lib/server/prisma"
import { apiError } from "@/lib/server/api"
import { pushNotifySchema } from "@/lib/validation"

function requireCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (!secret) return { ok: false as const, error: NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 }) }
  if (auth !== `Bearer ${secret}`) return { ok: false as const, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  return { ok: true as const }
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com"

  if (!publicKey || !privateKey) {
    return { ok: false as const, error: "VAPID keys missing" }
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return { ok: true as const }
}

export async function POST(req: NextRequest) {
  const cron = requireCron(req)
  if (!cron.ok) return cron.error

  const body = await req.json().catch(() => null)
  const parsed = pushNotifySchema.safeParse(body)
  if (!parsed.success) return apiError("Payload inválido")

  const vapid = configureWebPush()
  if (!vapid.ok) return NextResponse.json({ error: vapid.error }, { status: 503 })

  const { userId, title, body: messageBody, url } = parsed.data

  const subs = await prisma.pushSubscription.findMany({
    where: userId ? { userId } : undefined,
    select: { id: true, endpoint: true, p256dh: true, auth: true, userId: true },
  })

  const payload = JSON.stringify({
    title,
    body: messageBody,
    url: url ?? "/inicio",
  })

  const results = await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: {
              p256dh: s.p256dh,
              auth: s.auth,
            },
          } as any,
          payload,
        )
        return { id: s.id, userId: s.userId, ok: true as const }
      } catch (e: any) {
        const statusCode = Number(e?.statusCode || 0)
        // Subscription expired or invalid.
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => null)
        }
        return { id: s.id, userId: s.userId, ok: false as const, statusCode }
      }
    }),
  )

  return NextResponse.json({
    ok: true,
    attempted: results.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  })
}
