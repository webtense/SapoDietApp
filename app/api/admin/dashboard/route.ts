import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const [totalUsers, activeUsers, pendingInvitations, loginsToday] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", status: "ACTIVE" } }),
    prisma.invitation.count({ where: { status: "PENDING" } }),
    prisma.loginEvent.count({ where: { createdAt: { gte: startOfToday() } } }),
  ])

  return NextResponse.json({
    ok: true,
    stats: {
      totalUsers,
      activeUsers,
      pendingInvitations,
      loginsToday,
    },
  })
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}
