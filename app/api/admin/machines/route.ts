import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { z } from "zod"

const createMachineSchema = z.object({
  name: z.string().min(1),
  group: z.enum(["UPPER", "LOWER", "FULL"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
  tips: z.string().optional(),
  recommendedWeight: z.number().optional(),
  gymId: z.string().optional(), // si se proporciona, crear GymMachine también
})

export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const models = await prisma.machineModel.findMany({
      include: {
        exercises: {
          select: { id: true, name: true },
        },
        _count: {
          select: { gymMachines: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ ok: true, models })
  } catch (err) {
    return NextResponse.json(
      { error: "Error loading machines" },
      { status: 400 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = createMachineSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  try {
    const model = await prisma.machineModel.create({
      data: {
        name: parsed.data.name,
        group: parsed.data.group,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        tips: parsed.data.tips,
        recommendedWeight: parsed.data.recommendedWeight,
      },
    })

    return NextResponse.json({ ok: true, model }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error creating machine"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
