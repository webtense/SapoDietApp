import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"

const goalPatchSchema = z.object({
  targetWeightKg: z.number().min(30).max(500),
})

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = goalPatchSchema.safeParse(body)
  if (!parsed.success) return apiError("Meta inválida")

  const { targetWeightKg } = parsed.data

  const goal = await prisma.goal.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      targetWeightKg,
    },
    update: {
      targetWeightKg,
    },
  })

  return NextResponse.json({ goal })
}
