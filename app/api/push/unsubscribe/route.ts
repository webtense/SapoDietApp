import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { pushUnsubscribeSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = pushUnsubscribeSchema.safeParse(body)
  if (!parsed.success) return apiError("Payload inválido")

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: user.id,
      endpoint: parsed.data.endpoint,
    },
  })

  return NextResponse.json({ ok: true })
}
