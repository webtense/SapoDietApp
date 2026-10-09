import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/server/security'
import { prisma } from '@/lib/server/prisma'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')
  const attendances = await prisma.gymAttendance.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: limit,
  })

  return NextResponse.json({ attendances })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { attendances } = body

  if (!Array.isArray(attendances)) {
    return NextResponse.json({ error: 'Expected array of attendances' }, { status: 400 })
  }

  // Crear o actualizar asistencias (upsert por date + gym)
  const created = await Promise.all(
    attendances.map(async (att: any) => {
      const startTime = new Date(att.startTime)
      const endTime = new Date(att.endTime)
      const durationMin = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

      return prisma.gymAttendance.upsert({
        where: {
          id: `${user.id}-${att.date}-${att.gym}`.replace(/\s+/g, '-'),
        },
        create: {
          userId: user.id,
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
    })
  )

  return NextResponse.json({ created: created.length, attendances: created })
}
