import { prisma } from "@/lib/server/prisma"
import { getGA4Summary } from "@/lib/server/ga4"
import { getInstagramSummary } from "@/lib/server/instagram"
import { getEmailSubscribersSummary } from "@/lib/server/email-subscribers"
import { getStripeSummary, getMonthlyArpu } from "@/lib/server/stripe-metrics"

const AD_SPEND_KEY = "MONTHLY_AD_SPEND"

function startOfPeriod(days: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

export async function getMonthlyAdSpend(): Promise<number> {
  const setting = await prisma.marketingSetting.findUnique({ where: { key: AD_SPEND_KEY } })
  if (setting) return setting.value
  const envValue = Number(process.env.MONTHLY_AD_SPEND || 0)
  return Number.isFinite(envValue) ? envValue : 0
}

export async function setMonthlyAdSpend(value: number) {
  await prisma.marketingSetting.upsert({
    where: { key: AD_SPEND_KEY },
    update: { value },
    create: { key: AD_SPEND_KEY, value },
  })
}

export async function getDashboardMetrics(days: number) {
  const since = startOfPeriod(days)

  const [
    ga4,
    stripeSummary,
    arpu,
    instagram,
    emailSubscribers,
    adSpend,
    totalTesters,
    newTestersInPeriod,
    activeTesters,
    proUsers,
    reviewAgg,
    recentReviews,
  ] = await Promise.all([
    getGA4Summary(days),
    getStripeSummary(days),
    getMonthlyArpu(),
    getInstagramSummary(),
    getEmailSubscribersSummary(),
    getMonthlyAdSpend(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", createdAt: { gte: since } } }),
    prisma.user.count({ where: { role: "USER", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "USER", subscriptionStatus: "PRO" } }),
    prisma.review.aggregate({
      where: { approved: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, rating: true, comment: true, source: true, createdAt: true },
    }),
  ])

  // KPIs
  const cac = newTestersInPeriod > 0 && adSpend > 0 ? adSpend / newTestersInPeriod : null

  const avgMonthlyPrice = arpu ?? 0
  // Estimación de vida media del cliente PRO: antigüedad media (en meses) de
  // los usuarios PRO actuales. Es una aproximación razonable sin histórico de
  // bajas; se etiqueta como estimación en la UI.
  const proUsersData = await prisma.user.findMany({
    where: { role: "USER", subscriptionStatus: "PRO" },
    select: { createdAt: true },
  })
  const avgLifetimeMonths =
    proUsersData.length > 0
      ? proUsersData.reduce((acc, u) => {
          const months = (Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
          return acc + Math.max(months, 1)
        }, 0) / proUsersData.length
      : 0
  const ltv = avgMonthlyPrice > 0 ? avgMonthlyPrice * Math.max(avgLifetimeMonths, 1) : null

  const conversionRate =
    ga4.configured && ga4.totalSessions > 0
      ? (stripeSummary.totalPurchases / ga4.totalSessions) * 100
      : totalTesters > 0
        ? (proUsers / totalTesters) * 100
        : null

  return {
    period: { days, since: since.toISOString() },
    visits: ga4,
    purchases: stripeSummary,
    kpis: {
      cac,
      ltv,
      conversionRate,
      conversionBasis: ga4.configured && ga4.totalSessions > 0 ? "visitas GA4" : "testers totales",
      arpu: avgMonthlyPrice || null,
      avgLifetimeMonths: avgLifetimeMonths || null,
      monthlyAdSpend: adSpend,
    },
    testers: {
      total: totalTesters,
      newInPeriod: newTestersInPeriod,
      active: activeTesters,
      pro: proUsers,
    },
    reviews: {
      count: reviewAgg._count._all,
      avgRating: reviewAgg._avg.rating ?? null,
      recent: recentReviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    },
    emailSubscribers,
    instagram,
  }
}
