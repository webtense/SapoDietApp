import { prisma } from "@/lib/server/prisma"
import { APP_VERSION, BUILD_ID } from "@/lib/version"

export const revalidate = 0
export const dynamic = "force-dynamic"

async function resolveForceUpdateAt(): Promise<string | null> {
  try {
    const now = new Date()
    const due = await prisma.scheduledUpdate.findFirst({
      where: { status: "PENDING", scheduledFor: { lte: now } },
      orderBy: { scheduledFor: "desc" },
    })
    if (due) {
      await prisma.scheduledUpdate.updateMany({
        where: { status: "PENDING", scheduledFor: { lte: now } },
        data: { status: "EXECUTED" },
      })
      await prisma.featureFlag.upsert({
        where: { name: "force_update" },
        create: { name: "force_update", enabled: true, description: due.scheduledFor.toISOString() },
        update: { enabled: true, description: due.scheduledFor.toISOString() },
      })
    }

    const flag = await prisma.featureFlag.findUnique({ where: { name: "force_update" } })
    if (flag?.enabled && flag.description) return flag.description
    return null
  } catch {
    return null
  }
}

export async function GET() {
  const forceUpdateAt = await resolveForceUpdateAt()

  return Response.json(
    {
      version: APP_VERSION,
      commit: BUILD_ID,
      buildTime: process.env.BUILD_TIME || null,
      forceUpdateAt,
      timestamp: Date.now(),
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  )
}
