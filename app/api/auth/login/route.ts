import { compare } from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { createSession, markUserLoggedIn } from "@/lib/server/security"
import { authSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  const userAgent = req.headers.get("user-agent") || undefined
  const rate = await checkRateLimit(`login:${ip}`, 20, 60_000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos" },
      {
        status: 429,
        headers: rate.retryAfter ? { "Retry-After": String(rate.retryAfter) } : undefined,
      },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = authSchema.pick({ email: true, password: true }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const email = parsed.data.email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Cuenta pendiente o inactiva" }, { status: 403 })
  }

  if (!user.passwordHash) {
    return NextResponse.json({ error: "Cuenta pendiente de activación" }, { status: 403 })
  }

  const valid = await compare(parsed.data.password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
  }

  await createSession(user.id)
  await markUserLoggedIn(user.id, ip, userAgent)
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
  })
}
