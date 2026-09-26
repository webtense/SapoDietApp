import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { z } from "zod"

const addMachineSchema = z.object({
  machineModelId: z.string().min(1).optional(),
  name: z.string().min(1).max(120).optional(),
  group: z.enum(["UPPER", "LOWER", "FULL"]).optional(),
  description: z.string().max(1000).optional(),
  instructions: z.string().max(1000).optional(),
  tips: z.string().max(1000).optional(),
  recommendedWeight: z.number().optional(),
  assetNumber: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id } = await params

  const machines = await prisma.gymMachine.findMany({
    where: { gymId: id },
    include: { machineModel: true, weightOptions: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ ok: true, machines })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { id } = await params

  const gym = await prisma.gym.findUnique({ where: { id } })
  if (!gym) {
    return NextResponse.json({ error: "Gimnasio no encontrado" }, { status: 404 })
  }
  if (gym.createdById !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = addMachineSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }
  const data = parsed.data

  if (!data.machineModelId && !data.name) {
    return NextResponse.json(
      { error: "Debes elegir un modelo existente o indicar un nombre para crear uno nuevo" },
      { status: 400 }
    )
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let machineModelId = data.machineModelId

      if (!machineModelId) {
        const model = await tx.machineModel.create({
          data: {
            name: data.name!,
            group: data.group ?? "FULL",
            description: data.description,
            instructions: data.instructions,
            tips: data.tips,
            recommendedWeight: data.recommendedWeight,
          },
        })
        machineModelId = model.id
      }

      const gymMachine = await tx.gymMachine.create({
        data: {
          gymId: id,
          machineModelId,
          assetNumber: data.assetNumber,
          notes: data.notes,
        },
        include: { machineModel: true },
      })

      return gymMachine
    })

    return NextResponse.json({ ok: true, machine: result }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error añadiendo la máquina"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
