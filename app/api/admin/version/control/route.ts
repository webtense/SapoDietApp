import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Middleware: Solo ADMIN
async function checkAdmin(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')

  if (role !== 'ADMIN') {
    return { authorized: false }
  }
  return { authorized: true, userId }
}

export async function POST(req: NextRequest) {
  const auth = await checkAdmin(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { action, version, scheduledTime } = await req.json()

    if (action === 'FORCE_UPDATE') {
      // Broadcast message a todos los clientes (simulado en version-manager)
      await prisma.versionAnalytics.create({
        data: {
          event: 'FORCE_UPDATE_INITIATED',
          version,
          metadata: JSON.stringify({ triggeredBy: auth.userId }),
        },
      })
      return NextResponse.json({ ok: true, message: 'Force update sent to all clients' })
    }

    if (action === 'SCHEDULE_UPDATE') {
      await prisma.scheduledUpdate.create({
        data: {
          version,
          scheduledFor: new Date(scheduledTime),
          status: 'PENDING',
        },
      })
      return NextResponse.json({ ok: true, message: 'Update scheduled' })
    }

    if (action === 'ROLLBACK') {
      await prisma.versionAnalytics.create({
        data: {
          event: 'ROLLBACK_INITIATED',
          version,
          metadata: JSON.stringify({ triggeredBy: auth.userId }),
        },
      })
      return NextResponse.json({ ok: true, message: `Rollback to ${version} initiated` })
    }

    if (action === 'TOGGLE_FLAG') {
      const { flagName, enabled } = await req.json()
      const flag = await prisma.featureFlag.upsert({
        where: { name: flagName },
        create: { name: flagName, enabled, description: `Feature flag: ${flagName}` },
        update: { enabled },
      })
      return NextResponse.json({ ok: true, flag })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Admin control error:', error)
    return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = await checkAdmin(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const flags = await prisma.featureFlag.findMany()
    const versionHistory = await prisma.versionHistory.findMany({ orderBy: { deployedAt: 'desc' }, take: 10 })
    const scheduledUpdates = await prisma.scheduledUpdate.findMany({ where: { status: 'PENDING' } })

    return NextResponse.json({ flags, versionHistory, scheduledUpdates })
  } catch (error) {
    console.error('Get admin data error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
