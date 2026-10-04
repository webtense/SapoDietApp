import { requireAdmin } from '@/lib/server/api'
import { prisma } from '@/lib/server/prisma'
import { NextResponse } from 'next/server'

/**
 * Resumen rápido de métricas CRM (usuarios, newsletter, logins últimas 24h).
 * Endpoint separado de /api/admin/metrics para no duplicar datos.
 */
export async function GET() {
  const { user: admin, error } = await requireAdmin()
  if (error || !admin) return error

  const [totalUsers, activeUsers24h, newsletterSubscribers, loginEventsLast24h] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({
      where: {
        role: 'USER',
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.newsletterSubscriber.count({
      where: { status: 'CONFIRMED' },
    }),
    prisma.loginEvent.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return NextResponse.json({
    ok: true,
    stats: {
      totalUsers,
      activeUsers24h,
      newsletterSubscribers,
      loginEventsLast24h,
      timestamp: new Date().toISOString(),
    },
  })
}
