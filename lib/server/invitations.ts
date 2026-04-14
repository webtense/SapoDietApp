import { prisma } from "@/lib/server/prisma"
import { createSessionToken, hashToken } from "@/lib/server/security-utils"
import { sendEmail } from "./email"

const INVITATION_TTL_DAYS = Number.parseInt(process.env.INVITATION_TTL_DAYS || "7", 10)

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export async function createInvitationForUser(userId: string, invitedByUserId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error("Usuario no encontrado para invitación")
  }

  const rawToken = createSessionToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = addDays(new Date(), INVITATION_TTL_DAYS)

  const invitation = await prisma.invitation.create({
    data: {
      email: user.email,
      name: user.displayName ?? user.name ?? undefined,
      tokenHash,
      expiresAt,
      invitedByUserId,
      invitedUserId: user.id,
    },
  })

  const invitationLink = buildInvitationLink(rawToken)
  
  await sendEmail({
    to: user.email,
    subject: "¡Bienvenido a SapoFit! 👋",
    text: `Hola ${user.displayName ?? user.name ?? 'Usuario'}, has sido invitado a SapoFit. Usa este enlace para registrarte: ${invitationLink}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">¡Bienvenido a SapoFit! 👋</h2>
        <p>Hola <strong>${user.displayName ?? user.name ?? 'Usuario'}</strong>,</p>
        <p>Has sido invitado a SapoFit, tu plan de nutrición y entrenamiento personalizado.</p>
        <p>Para comenzar, haz clic en el botón de abajo:</p>
        <a href="${invitationLink}" 
           style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
          Aceptar invitación
        </a>
        <p style="color: #6b7280; font-size: 14px;">Este enlace expira en ${INVITATION_TTL_DAYS} días.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          SapoFit - Tu plan de nutrición y entrenamiento personalizado
        </p>
      </div>
    `,
  }).catch((err) => console.error("[Invitation Email] Failed to send:", err))

  return { invitation, token: rawToken }
}

export async function refreshInvitation(invitationId: string) {
  const rawToken = createSessionToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = addDays(new Date(), INVITATION_TTL_DAYS)

  const invitation = await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      tokenHash,
      expiresAt,
      status: "PENDING",
      acceptedAt: null,
    },
  })

  return { invitation, token: rawToken }
}

export function buildInvitationLink(token: string) {
  const baseUrl = process.env.APP_URL || "http://localhost:3000"
  return `${baseUrl}/invitacion/${token}`
}
