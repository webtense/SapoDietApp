import { hash } from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { createSession, hashToken, markUserLoggedIn } from "@/lib/server/security"
import { setPasswordSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = setPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const tokenHash = hashToken(parsed.data.token)
  const ip = req.headers.get("x-forwarded-for") || "local"
  const userAgent = req.headers.get("user-agent") || undefined
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
    return NextResponse.json({ error: "La invitación ya fue utilizada" }, { status: 409 })
  }

  const displayName = parsed.data.name ?? invitation.name ?? invitation.email
  const passwordHash = await hash(parsed.data.password, 12)

  let user = invitation.invitedUser

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: invitation.email,
        name: displayName,
        displayName,
        role: "USER",
        status: "INVITED",
        invitedById: invitation.invitedByUserId,
        profile: { create: {} },
        goal: { create: {} },
      },
    })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: "ACTIVE",
        name: displayName,
        displayName,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date(), invitedUserId: user.id },
    }),
    prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    }),
    prisma.goal.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    }),
  ])

  await createSession(user.id)
  await markUserLoggedIn(user.id, ip, userAgent)

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: invitation.email,
      name: displayName,
      role: "USER",
      status: "ACTIVE",
    },
  })
}
