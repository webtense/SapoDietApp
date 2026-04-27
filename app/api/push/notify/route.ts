import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/server/api"
import { pushNotifySchema } from "@/lib/validation"
import { sendPushToUser } from "@/lib/server/push"

function requireCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (!secret) return { ok: false as const, error: NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 }) }
  if (auth !== `Bearer ${secret}`) return { ok: false as const, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  return { ok: true as const }
}

export async function POST(req: NextRequest) {
  const cron = requireCron(req)
  if (!cron.ok) return cron.error

  const body = await req.json().catch(() => null)
  const parsed = pushNotifySchema.safeParse(body)
  if (!parsed.success) return apiError("Payload inválido")

  const { userId, title, body: messageBody, url } = parsed.data
  if (!userId) return apiError("userId requerido", 400)

  const result = await sendPushToUser(userId, { title, body: messageBody, url })
  const status = result.ok ? 200 : 503
  return NextResponse.json(result, { status })
}
