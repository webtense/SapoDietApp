import { NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { stripe } from "@/lib/server/stripe"

export async function POST() {
  const { user, error } = await requireUser()
  if (error) return error

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!fullUser) return apiError("Usuario no encontrado", 404)

  if (fullUser.subscriptionStatus === "PRO") {
    return apiError("Ya tienes una suscripción activa", 400)
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) return apiError("Stripe no configurado", 503)

  const appUrl = process.env.APP_URL || "http://localhost:3000"

  let customerId = fullUser.stripeCustomerId ?? undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: fullUser.email,
      name: fullUser.name ?? undefined,
      metadata: { userId: fullUser.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: fullUser.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/perfil?upgrade=success`,
    cancel_url: `${appUrl}/perfil?upgrade=cancelled`,
    metadata: { userId: fullUser.id },
    subscription_data: {
      trial_period_days: 30,
      metadata: { userId: fullUser.id },
    },
    allow_promotion_codes: true,
    locale: "es",
  })

  return NextResponse.json({ url: session.url })
}
