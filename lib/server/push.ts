import webpush from "web-push"
import { prisma } from "@/lib/server/prisma"

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || ""
}

export function configureWebPush() {
  const publicKey = getVapidPublicKey()
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com"

  if (!publicKey || !privateKey) {
    return { ok: false as const, error: "VAPID keys missing" }
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return { ok: true as const }
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const vapid = configureWebPush()
  if (!vapid.ok) {
    return { ok: false as const, attempted: 0, sent: 0, failed: 0, error: vapid.error }
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/recordatorios",
  })

  const results = await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          } as any,
          message,
        )

        return { id: sub.id, ok: true as const }
      } catch (error: any) {
        const statusCode = Number(error?.statusCode || 0)
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null)
        }

        return { id: sub.id, ok: false as const, statusCode }
      }
    }),
  )

  return {
    ok: true as const,
    attempted: results.length,
    sent: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    results,
  }
}
