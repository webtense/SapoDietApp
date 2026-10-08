import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

const bodySchema = z.object({
  // IDs de WorkoutExercise (las "máquinas" mostradas hoy en /entrenamiento),
  // en el orden deseado por el usuario.
  machineIds: z.array(z.string()).min(1),
})

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { machineIds } = parsed.data

  try {
    // Verifica que todos los WorkoutExercise pertenezcan a un plan del usuario
    const owned = await prisma.workoutExercise.findMany({
      where: {
        id: { in: machineIds },
        workoutPlan: { userId: user.id },
      },
      select: { id: true },
    })

    if (owned.length !== machineIds.length) {
      return NextResponse.json({ error: "Alguna máquina no pertenece al usuario" }, { status: 403 })
    }

    // Persiste el orden del usuario (preferencia general) y reordena las
    // entradas afectadas para que el efecto sea inmediato en /entrenamiento.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { machineOrder: machineIds },
      }),
      ...machineIds.map((id, index) =>
        prisma.workoutExercise.update({
          where: { id },
          data: { order: -(index + 1) }, // paso intermedio para evitar colisión @@unique
        }),
      ),
    ])

    await prisma.$transaction(
      machineIds.map((id, index) =>
        prisma.workoutExercise.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    )

    return NextResponse.json({ ok: true, machineOrder: machineIds })
  } catch (err) {
    console.error("[preferences/machine-order]", err)
    return NextResponse.json({ error: "Error guardando el orden" }, { status: 500 })
  }
}
