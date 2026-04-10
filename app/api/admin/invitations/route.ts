import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { DEFAULT_MODULE_KEYS } from "@/lib/constants/modules"
import { createInvitationForUser } from "@/lib/server/invitations"
import { adminCreateInvitationSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error || !admin) return error

  const payload = await req.json().catch(() => null)
  const parsed = adminCreateInvitationSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  let targetUserId = parsed.data.userId || null

  if (!targetUserId && parsed.data.email && parsed.data.name) {
    const email = parsed.data.email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      targetUserId = existing.id
    } else {
      const created = await prisma.user.create({
        data: {
          email,
          name: parsed.data.name,
          displayName: parsed.data.name,
          role: "USER",
          status: "INVITED",
          invitedById: admin.id,
          profile: { create: {} },
          goal: { create: {} },
        },
      })
      targetUserId = created.id

      await Promise.all(
        DEFAULT_MODULE_KEYS.map((moduleKey) =>
          prisma.userModule.upsert({
            where: { userId_moduleKey: { userId: created.id, moduleKey } },
            update: { enabled: true },
            create: { userId: created.id, moduleKey, enabled: true },
          }),
        ),
      )
    }
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "Usuario no válido" }, { status: 400 })
  }

  const { invitation, token } = await createInvitationForUser(targetUserId, admin.id)

  return NextResponse.json({
    ok: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      token,
    },
  })
}
