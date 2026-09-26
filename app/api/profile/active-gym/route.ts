import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { z } from "zod"

const activeGymSchema = z.object({
  gymId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = activeGymSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const gym = await prisma.gym.findUnique({ where: { id: parsed.data.gymId } })
  if (!gym) {
    return NextResponse.json({ error: "Gimnasio no encontrado" }, { status: 404 })
  }

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, gymId: gym.id },
    update: { gymId: gym.id },
  })

  return NextResponse.json({ ok: true, profile })
}
