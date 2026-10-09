import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/server/security'
import { prisma } from '@/lib/server/prisma'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const attendances = await prisma.gymAttendance.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  })

  if (attendances.length === 0) {
    return NextResponse.json({
      totalSessions: 0,
      totalMinutes: 0,
      totalDays: 0,
      streak: 0,
      avgPerWeek: 0,
      avgDuration: 0,
      firstDate: null,
      lastDate: null,
    })
  }

  // Estadísticas básicas
  const totalSessions = attendances.length
  const totalMinutes = attendances.reduce((sum, a) => sum + a.durationMin, 0)
  const avgDuration = Math.round(totalMinutes / totalSessions)

  // Fechas únicas
  const uniqueDates = new Set(attendances.map(a => a.date.toISOString().split('T')[0]))
  const totalDays = uniqueDates.size

  // Primer y último
  const lastDate = attendances[0]?.date
  const firstDate = attendances[attendances.length - 1]?.date

  // Días entre primera y última sesión
  const daysBetween = firstDate && lastDate
    ? Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1

  // Promedio por semana
  const weeks = Math.max(1, Math.floor(daysBetween / 7))
  const avgPerWeek = Math.round(totalSessions / weeks * 10) / 10

  // Racha (días consecutivos, hacia atrás)
  let streak = 0
  let currentDate = new Date()
  while (uniqueDates.has(currentDate.toISOString().split('T')[0])) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  // Intensidad (sesiones en últimos 7, 14, 30 días)
  const now = new Date()
  const last7 = attendances.filter(
    a => (now.getTime() - a.date.getTime()) / (1000 * 60 * 60 * 24) <= 7
  ).length
  const last14 = attendances.filter(
    a => (now.getTime() - a.date.getTime()) / (1000 * 60 * 60 * 24) <= 14
  ).length
  const last30 = attendances.filter(
    a => (now.getTime() - a.date.getTime()) / (1000 * 60 * 60 * 24) <= 30
  ).length

  return NextResponse.json({
    totalSessions,
    totalMinutes,
    totalDays,
    streak,
    avgPerWeek,
    avgDuration,
    firstDate: firstDate?.toISOString().split('T')[0],
    lastDate: lastDate?.toISOString().split('T')[0],
    intensity: { last7, last14, last30 },
  })
}
