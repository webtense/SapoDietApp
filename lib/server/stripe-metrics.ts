import { stripe } from "@/lib/server/stripe"

export interface StripeDayRevenue {
  date: string
  amount: number
  count: number
}

export interface StripeSummary {
  configured: boolean
  totalRevenue: number
  totalPurchases: number
  newSubscriptions: number
  currency: string
  daily: StripeDayRevenue[]
  error?: string
}

function dayKey(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10)
}

export async function getStripeSummary(days: number): Promise<StripeSummary> {
  const empty: StripeSummary = {
    configured: false,
    totalRevenue: 0,
    totalPurchases: 0,
    newSubscriptions: 0,
    currency: "eur",
    daily: [],
  }

  if (!process.env.STRIPE_SECRET_KEY) return empty

  try {
    const since = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
    const byDay = new Map<string, { amount: number; count: number }>()
    let totalRevenue = 0
    let totalPurchases = 0
    let currency = "eur"

    // checkout.session.completed = compras/altas directas (única fuente de verdad
    // para "compra directa" ya que es lo que dispara el webhook de suscripción PRO).
    let startingAfter: string | undefined
    for (;;) {
      const sessions = await stripe.checkout.sessions.list({
        created: { gte: since },
        limit: 100,
        starting_after: startingAfter,
      })

      for (const session of sessions.data) {
        if (session.status !== "complete" || !session.amount_total) continue
        currency = session.currency || currency
        totalRevenue += session.amount_total
        totalPurchases += 1
        const key = dayKey(session.created)
        const entry = byDay.get(key) || { amount: 0, count: 0 }
        entry.amount += session.amount_total
        entry.count += 1
        byDay.set(key, entry)
      }

      if (!sessions.has_more || sessions.data.length === 0) break
      startingAfter = sessions.data[sessions.data.length - 1].id
    }

    const daily = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, amount: v.amount / 100, count: v.count }))

    return {
      configured: true,
      totalRevenue: totalRevenue / 100,
      totalPurchases,
      newSubscriptions: totalPurchases,
      currency,
      daily,
    }
  } catch (err) {
    return { ...empty, configured: true, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

/** Precio medio mensual (ARPU) de la suscripción PRO, usado para estimar el LTV. */
export async function getMonthlyArpu(): Promise<number | null> {
  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) return null
  try {
    const price = await stripe.prices.retrieve(priceId)
    if (!price.unit_amount) return null
    return price.unit_amount / 100
  } catch {
    return null
  }
}
