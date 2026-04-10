import { prisma } from "@/lib/server/prisma"
import { createSessionToken, hashToken } from "@/lib/server/security-utils"

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
