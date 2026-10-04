import { requireAdmin } from '@/lib/server/api'
import { prisma } from '@/lib/server/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error || !admin) return error

  const [totalUsers, activeUsers, newsletterSubscribers, loginEventsToday] = await Promise.all([
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
      activeUsers24h: activeUsers,
      newsletterSubscribersCONFIRMED: newsletterSubscribers,
      loginEventsLast24h: loginEventsToday,
      timestamp: new Date().toISOString(),
    },
  })
}
