import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { adminCreateGymSchema } from "@/lib/validation"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const gyms = await prisma.gym.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { machines: true } } },
  })

  return NextResponse.json({ ok: true, gyms })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = adminCreateGymSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  try {
    const gym = await prisma.gym.create({ data: parsed.data })
    return NextResponse.json({ ok: true, gym })
  } catch (err) {
    console.error("[admin/gyms]", err)
    return NextResponse.json({ error: "Error creando el gimnasio" }, { status: 500 })
  }
}
