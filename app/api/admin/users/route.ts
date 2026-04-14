import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { DEFAULT_MODULE_KEYS } from "@/lib/constants/modules"
import { createInvitationForUser } from "@/lib/server/invitations"
import { adminCreateUserSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get("status")
  const search = searchParams.get("search")

  const users = await prisma.user.findMany({
    where: {
      role: "USER",
      status: status ? (status as any) : undefined,
      OR: search
        ? [
            { email: { contains: search } },
            { name: { contains: search } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      pricing: true,
      modules: {
        orderBy: { moduleKey: "asc" },
      },
      profile: true,
      goal: true,
      mealPlans: { orderBy: { createdAt: "desc" }, take: 1 },
      exerciseLogs: { where: { completed: true }, select: { id: true } },
      mealLogs: { where: { completed: true }, select: { id: true } },
      dailyLogs: { orderBy: { date: "desc" }, take: 30 },
      invitationsReceived: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { loginEvents: true } },
    },
  })

  return NextResponse.json({
    ok: true,
    users: users.map((u) => {
      const hasProfile = u.profile?.age && u.profile?.heightCm && u.profile?.weightKg
      const hasGoal = u.goal?.targetWeightKg
      const hasMealPlan = u.mealPlans && u.mealPlans.length > 0
      const profileCompletion = [hasProfile, hasGoal, hasMealPlan].filter(Boolean).length

      const weightEntries = u.dailyLogs?.filter(d => d.weightKg).slice(0, 7) || []
      const recentWeight = weightEntries[0]?.weightKg
      const firstWeight = weightEntries[weightEntries.length - 1]?.weightKg

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        status: u.status,
        role: u.role,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        loginCount: u._count.loginEvents,
        profileCompletion,
        hasProfile: !!hasProfile,
        hasGoal: !!hasGoal,
        hasMealPlan: !!hasMealPlan,
        recentWeight,
        weightChange: firstWeight && recentWeight ? Number((recentWeight - firstWeight).toFixed(1)) : null,
        mealsCompleted: u.mealLogs?.length || 0,
        workoutsCompleted: u.exerciseLogs?.length || 0,
        daysActive: u.dailyLogs?.length || 0,
        modules: u.modules.map((module) => ({ moduleKey: module.moduleKey, enabled: module.enabled })),
        pricing: u.pricing ? { label: u.pricing.label, monthlyPrice: u.pricing.monthlyPrice } : null,
        latestInvitation: u.invitationsReceived[0]
          ? {
              id: u.invitationsReceived[0].id,
              status: u.invitationsReceived[0].status,
              expiresAt: u.invitationsReceived[0].expiresAt,
              createdAt: u.invitationsReceived[0].createdAt,
            }
          : null,
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error || !admin) return error

  const payload = await req.json().catch(() => null)
  const parsed = adminCreateUserSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const email = parsed.data.email.trim().toLowerCase()
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      displayName: parsed.data.name,
      role: "USER",
      status: "INVITED",
      invitedById: admin.id,
      profile: { create: {} },
      goal: { create: {} },
    },
  })

  const modules = parsed.data.modules && parsed.data.modules.length > 0 ? parsed.data.modules : DEFAULT_MODULE_KEYS

  await Promise.all(
    modules.map((moduleKey) =>
      prisma.userModule.upsert({
        where: { userId_moduleKey: { userId: user.id, moduleKey } },
        update: { enabled: true },
        create: { userId: user.id, moduleKey, enabled: true },
      }),
    ),
  )

  if (parsed.data.priceLabel || parsed.data.monthlyPrice !== undefined) {
    await prisma.userPricing.create({
      data: {
        userId: user.id,
        label: parsed.data.priceLabel ?? "Plan personalizado",
        monthlyPrice: parsed.data.monthlyPrice,
      },
    })
  }

  let invitationInfo: { id: string; token: string; expiresAt: Date } | null = null

  if (parsed.data.sendInvitation !== false) {
    const { invitation, token } = await createInvitationForUser(user.id, admin.id)
    invitationInfo = { id: invitation.id, token, expiresAt: invitation.expiresAt }
  }

  return NextResponse.json({
    ok: true,
    userId: user.id,
    invitation: invitationInfo,
  })
}
