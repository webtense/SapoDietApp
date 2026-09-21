import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { adminCreateMachineSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const gymId = req.nextUrl.searchParams.get("gymId")

  const machines = await prisma.gymMachine.findMany({
    where: gymId ? { gymId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { gym: true, machineModel: true },
  })

  return NextResponse.json({ ok: true, machines })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = adminCreateMachineSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  try {
    const machine = await prisma.gymMachine.create({ data: parsed.data })
    return NextResponse.json({ ok: true, machine })
  } catch (err) {
    console.error("[admin/machines]", err)
    return NextResponse.json({ error: "Error creando la máquina" }, { status: 500 })
  }
}
