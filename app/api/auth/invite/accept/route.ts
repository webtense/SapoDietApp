import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { hashToken } from "@/lib/server/security"
import { acceptInvitationSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = acceptInvitationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invitación inválida" }, { status: 400 })
  }

  const tokenHash = hashToken(parsed.data.token)
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: { invitedUser: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  }

  if (invitation.expiresAt < new Date()) {
    if (invitation.status !== "ACCEPTED") {
      await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } })
    }
    return NextResponse.json({ error: "La invitación ha caducado" }, { status: 410 })
  }

  if (invitation.status === "ACCEPTED") {
    return NextResponse.json({ error: "La invitación ya fue aceptada" }, { status: 409 })
  }

  return NextResponse.json({
    ok: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
      userId: invitation.invitedUserId,
    },
  })
}
