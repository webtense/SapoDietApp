import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { refreshInvitation } from "@/lib/server/invitations"

export async function POST(_: NextRequest, { params }: any) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const invitation = await prisma.invitation.findUnique({ where: { id: params.id } })
  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  }

  const { invitation: updated, token } = await refreshInvitation(invitation.id)

  return NextResponse.json({
    ok: true,
    invitation: {
      id: updated.id,
      expiresAt: updated.expiresAt,
      token,
    },
  })
}
