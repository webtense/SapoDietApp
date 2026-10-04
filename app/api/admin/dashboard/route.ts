import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const [totalUsers, activeToday, newToday, completedProfiles, healthCheck] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.loginEvent.count({ where: { createdAt: { gte: startOfToday() } } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: startOfToday() } } }),
      prisma.profile.count({ where: { onboardingCompleted: true } }),
      prisma.user.count({ where: { role: "USER" } }).then(count => count > 0 ? 'ok' : 'warning'),
    ])

    const totalCount = totalUsers || 1
    const completionRate = Math.round((completedProfiles / totalCount) * 100)

    return NextResponse.json({
      totalUsers,
      activeToday,
      newToday,
      completionRate,
      systemHealth: {
        status: healthCheck === 'ok' ? 'ok' : 'warning',
        message: healthCheck === 'ok' ? 'Sistema operativo' : 'Verificar conexión',
      },
    })
  } catch (e) {
    return NextResponse.json(
      {
        totalUsers: 0,
        activeToday: 0,
        newToday: 0,
        completionRate: 0,
        systemHealth: { status: 'error', message: 'Error en la consulta' },
      },
      { status: 500 }
    )
  }
}
