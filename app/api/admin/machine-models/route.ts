import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { adminCreateMachineModelSchema } from "@/lib/validation"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const machineModels = await prisma.machineModel.findMany({
    orderBy: { name: "asc" },
    include: { primaryMuscleGroup: true },
  })

  return NextResponse.json({ ok: true, machineModels })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = adminCreateMachineModelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  try {
    const machineModel = await prisma.machineModel.create({ data: parsed.data })
    return NextResponse.json({ ok: true, machineModel })
  } catch (err) {
    console.error("[admin/machine-models]", err)
    return NextResponse.json({ error: "Error creando el modelo de máquina" }, { status: 500 })
  }
}
