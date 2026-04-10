import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { adminUpdateModulesSchema } from "@/lib/validation"

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = adminUpdateModulesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  await Promise.all(
    parsed.data.modules.map((module) =>
      prisma.userModule.upsert({
        where: { userId_moduleKey: { userId: parsed.data.userId, moduleKey: module.moduleKey } },
        update: { enabled: module.enabled },
        create: { userId: parsed.data.userId, moduleKey: module.moduleKey, enabled: module.enabled },
      }),
    ),
  )

  return NextResponse.json({ ok: true })
}
