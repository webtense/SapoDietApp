import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { z } from "zod"

const createGymSchema = z.object({
  name: z.string().min(1).max(120),
  location: z.string().max(200).optional(),
})

export async function GET() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const gyms = await prisma.gym.findMany({
    where: { isPublic: true },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { machines: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ ok: true, gyms })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = createGymSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  try {
    const gym = await prisma.gym.create({
      data: {
        name: parsed.data.name,
        location: parsed.data.location,
        createdById: user.id,
      },
    })

    return NextResponse.json({ ok: true, gym }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error creando el gimnasio"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
