import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/server/security'
import { prisma } from '@/lib/server/prisma'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, attendances } = body

  if (!userId || !Array.isArray(attendances)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Validar que el usuario existe
  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let created = 0
  const errors: any[] = []

  for (const att of attendances) {
    try {
      const startTime = new Date(att.startTime)
      const endTime = new Date(att.endTime)
      const durationMin = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

      await prisma.gymAttendance.upsert({
        where: {
          id: `${userId}-${att.date}-${att.gym}`.replace(/\s+/g, '-').toLowerCase(),
        },
        create: {
          userId,
          date: new Date(att.date),
          startTime,
          endTime,
          durationMin,
          gym: att.gym,
          notes: att.notes,
        },
        update: {
          startTime,
          endTime,
          durationMin,
          notes: att.notes,
        },
      })
      created++
    } catch (err: any) {
      errors.push({ date: att.date, error: err.message })
    }
  }

  return NextResponse.json({
    success: true,
    created,
    total: attendances.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
