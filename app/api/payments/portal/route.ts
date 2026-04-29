import { NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { stripe } from "@/lib/server/stripe"

export async function POST() {
  const { user, error } = await requireUser()
  if (error) return error

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!fullUser?.stripeCustomerId) {
    return apiError("Sin suscripción activa", 400)
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: fullUser.stripeCustomerId,
    return_url: `${appUrl}/perfil`,
  })

  return NextResponse.json({ url: session.url })
}
