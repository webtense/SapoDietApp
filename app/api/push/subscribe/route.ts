import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { pushSubscribeSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = pushSubscribeSchema.safeParse(body)
  if (!parsed.success) return apiError("Suscripción inválida")

  const sub = parsed.data

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: user.id,
        endpoint: sub.endpoint,
      },
    },
    create: {
      userId: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: sub.userAgent ?? req.headers.get("user-agent") ?? null,
    },
    update: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: sub.userAgent ?? req.headers.get("user-agent") ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}
