import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { refreshInvitation, buildInvitationLink } from "@/lib/server/invitations"
import { sendEmail } from "@/lib/server/email"

export async function POST(_: NextRequest, { params }: any) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const invitation = await prisma.invitation.findUnique({ where: { id: params.id } })
  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  }

  const { invitation: updated, token } = await refreshInvitation(invitation.id)
  
  const invitationLink = buildInvitationLink(token)
  
  await sendEmail({
    to: invitation.email,
    subject: "Tu invitación a SapoFit ha sido reenviada 📧",
    text: `Tu invitación a SapoFit está lista. Usa este enlace: ${invitationLink}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Tu invitación a SapoFit 📧</h2>
        <p>Tu invitación ha sido reenviada. Haz clic en el botón de abajo para continuar:</p>
        <a href="${invitationLink}" 
           style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
          Aceptar invitación
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          SapoFit - Tu plan de nutrición y entrenamiento personalizado
        </p>
      </div>
    `,
  }).catch((err) => console.error("[Resend Email] Failed to send:", err))

  return NextResponse.json({
    ok: true,
    invitation: {
      id: updated.id,
      expiresAt: updated.expiresAt,
      token,
    },
  })
}
