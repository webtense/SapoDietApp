import { prisma } from '@/lib/prisma'

export class DeploymentService {
  static async getDeploymentStatus() {
    const current = await prisma.versionHistory.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { deployedAt: 'desc' },
    })
    const history = await prisma.versionHistory.findMany({ take: 10, orderBy: { deployedAt: 'desc' } })
    return { current, history }
  }

  static async forceUpdateAll(version: string) {
    await prisma.versionAnalytics.create({
      data: {
        event: 'FORCE_UPDATE_BROADCAST',
        version,
      },
    })
  }

  static async scheduleUpdate(version: string, time: Date) {
    return await prisma.scheduledUpdate.create({
      data: {
        version,
        scheduledFor: time,
        status: 'PENDING',
      },
    })
  }

  static async rollback(toVersion: string) {
    await prisma.versionHistory.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'ARCHIVED' },
    })

    const history = await prisma.versionHistory.findFirst({
      where: { version: toVersion },
    })

    if (history) {
      await prisma.versionHistory.update({
        where: { id: history.id },
        data: { status: 'ACTIVE' },
      })
    }

    await prisma.versionAnalytics.create({
      data: {
        event: 'ROLLBACK_EXECUTED',
        version: toVersion,
      },
    })
  }

  static async getAnalytics(timeRange: 'day' | 'week' | 'month') {
    const days = { day: 1, week: 7, month: 30 }[timeRange]
    const since = new Date()
    since.setDate(since.getDate() - days)

    const analytics = await prisma.versionAnalytics.findMany({
      where: { timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
    })

    return {
      total: analytics.length,
      events: analytics.reduce((acc: any, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1
        return acc
      }, {}),
      byVersion: analytics.reduce((acc: any, e) => {
        if (e.version) {
          acc[e.version] = (acc[e.version] || 0) + 1
        }
        return acc
      }, {}),
    }
  }
}
