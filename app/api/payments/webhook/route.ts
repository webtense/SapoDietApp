import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { stripe } from "@/lib/server/stripe"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret no configurado" }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Sin firma" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== "subscription") break

      const userId = session.metadata?.userId as string | undefined

      if (!userId) {
        console.error("webhook: checkout.session.completed sin userId en metadata")
        break
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "PRO",
          stripeSubscriptionId: session.subscription as string,
        },
      })
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (!userId) break

      const status = sub.status === "active" || sub.status === "trialing" ? "PRO" : "FREE"
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: status },
      })
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (!userId) break

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "FREE",
          stripeSubscriptionId: null,
        },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
