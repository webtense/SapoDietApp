import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { event, version, oldVersion, userId, metadata } = await req.json()

    const analytics = await prisma.versionAnalytics.create({
      data: {
        event,
        version,
        oldVersion,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return NextResponse.json({ ok: true, id: analytics.id }, { status: 201 })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const event = searchParams.get('event')
    const version = searchParams.get('version')
    const days = parseInt(searchParams.get('days') || '7')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const where: any = { timestamp: { gte: since } }
    if (event) where.event = event
    if (version) where.version = version

    const analytics = await prisma.versionAnalytics.findMany({ where, orderBy: { timestamp: 'desc' } })

    return NextResponse.json({ analytics, total: analytics.length })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
