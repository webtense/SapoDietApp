import { prisma } from "@/lib/server/prisma"
import { APP_VERSION, BUILD_ID } from "@/lib/version"

const DEFAULT_FLAGS: Array<{ name: string; enabled: boolean; description: string }> = [
  { name: "changelog_modal", enabled: true, description: "Modal de changelog al pulsar la versión del footer" },
  { name: "pwa_install_prompt", enabled: true, description: "Aviso para instalar SapoFit como app" },
  { name: "update_push_notification", enabled: true, description: "Notificación del sistema cuando hay nueva versión" },
]

export type AdoptionRow = { version: string; users: number; percent: number }

export async function getDeploymentStatus() {
  await prisma.versionHistory.upsert({
    where: { version: APP_VERSION },
    create: { version: APP_VERSION, commit: BUILD_ID, status: "ACTIVE" },
    update: { commit: BUILD_ID, status: "ACTIVE" },
  })
  await prisma.versionHistory.updateMany({
    where: { version: { not: APP_VERSION }, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  })

  for (const flag of DEFAULT_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      create: flag,
      update: {},
    })
  }

  const [history, flags, scheduled, forceFlag, adoption] = await Promise.all([
    prisma.versionHistory.findMany({ orderBy: { deployedAt: "desc" }, take: 15 }),
    prisma.featureFlag.findMany({ where: { name: { not: "force_update" } }, orderBy: { name: "asc" } }),
    prisma.scheduledUpdate.findMany({ orderBy: { scheduledFor: "asc" }, take: 20 }),
    prisma.featureFlag.findUnique({ where: { name: "force_update" } }),
    getAdoption(7),
  ])

  const usersByVersion = new Map(adoption.rows.map((r) => [r.version, r.users]))

  return {
    current: { version: APP_VERSION, build: BUILD_ID, deployedAt: history.find((h) => h.version === APP_VERSION)?.deployedAt ?? null },
    lastForceUpdateAt: forceFlag?.enabled ? forceFlag.description : null,
    history: history.map((h) => ({ ...h, usersOnVersion: usersByVersion.get(h.version) ?? 0 })),
    flags,
    scheduled,
    adoption,
  }
}

export async function getAdoption(days: number): Promise<{ days: number; totalUsers: number; rows: AdoptionRow[] }> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const rows = await prisma.versionAnalytics.findMany({
    where: { event: "VERSION_DETECTED", createdAt: { gte: since }, userId: { not: null } },
    select: { version: true, userId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  // Última versión vista por cada usuario
  const latestByUser = new Map<string, string>()
  for (const row of rows) {
    if (row.userId && row.version && !latestByUser.has(row.userId)) latestByUser.set(row.userId, row.version)
  }

  const counts = new Map<string, number>()
  for (const version of latestByUser.values()) counts.set(version, (counts.get(version) ?? 0) + 1)

  const totalUsers = latestByUser.size
  const result: AdoptionRow[] = [...counts.entries()]
    .map(([version, users]) => ({ version, users, percent: totalUsers ? Math.round((users / totalUsers) * 100) : 0 }))
    .sort((a, b) => b.users - a.users)

  return { days, totalUsers, rows: result }
}

export async function forceUpdateAll(triggeredBy: string) {
  const at = new Date().toISOString()
  await prisma.featureFlag.upsert({
    where: { name: "force_update" },
    create: { name: "force_update", enabled: true, description: at },
    update: { enabled: true, description: at },
  })
  await prisma.versionAnalytics.create({
    data: { event: "FORCE_UPDATE_APPLIED", version: APP_VERSION, userId: triggeredBy, metadata: JSON.stringify({ source: "admin" }) },
  })
  return at
}

export async function scheduleUpdate(scheduledFor: Date) {
  return prisma.scheduledUpdate.create({
    data: { version: APP_VERSION, scheduledFor, status: "PENDING" },
  })
}

export async function cancelScheduledUpdate(id: string) {
  return prisma.scheduledUpdate.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "CANCELLED" },
  })
}

export async function toggleFlag(name: string, enabled: boolean) {
  return prisma.featureFlag.upsert({
    where: { name },
    create: { name, enabled, description: DEFAULT_FLAGS.find((f) => f.name === name)?.description ?? null },
    update: { enabled },
  })
}
