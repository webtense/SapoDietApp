import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { getGlobalMaxWeight } from "@/lib/server/workout-stats"
import { z } from "zod"
import { isValidYoutubeUrl } from "@/lib/youtube"

const createMachineSchema = z.object({
  name: z.string().min(1),
  group: z.enum(["UPPER", "LOWER", "FULL"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
  tips: z.string().optional(),
  recommendedWeight: z.number().optional(),
  videoUrl: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || isValidYoutubeUrl(val), {
      message: "La URL debe ser un enlace válido de YouTube",
    }),
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

    const modelsWithMax = await Promise.all(
      models.map(async (model) => {
        // Una máquina puede tener varios Exercise asociados (uno por nombre histórico);
        // calculamos el máximo global por cada uno y nos quedamos con el más alto.
        const maxes = await Promise.all(
          model.exercises.map((ex) => getGlobalMaxWeight(ex.id))
        )
        const globalMax = maxes
          .filter((m): m is NonNullable<typeof m> => m != null)
          .sort((a, b) => b.weight - a.weight)[0] ?? null
        return { ...model, globalMax }
      })
    )

    return NextResponse.json({ ok: true, models: modelsWithMax })
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
    const result = await prisma.$transaction(async (tx) => {
      const model = await tx.machineModel.create({
        data: {
          name: parsed.data.name,
          group: parsed.data.group,
          description: parsed.data.description,
          instructions: parsed.data.instructions,
          tips: parsed.data.tips,
          recommendedWeight: parsed.data.recommendedWeight,
          videoUrl: parsed.data.videoUrl || null,
        },
      })

      if (parsed.data.gymId) {
        await tx.gymMachine.create({
          data: {
            gymId: parsed.data.gymId,
            machineModelId: model.id,
            active: true,
          },
        })
      }

      return model
    })

    return NextResponse.json({ ok: true, model: result }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error creating machine"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
