import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser()
  if (error) return error

  const { id } = await params
  const challenge = await prisma.challenge.findUnique({ where: { id } })
  if (!challenge) return apiError("Reto no encontrado", 404)

  const participant = await prisma.userChallenge.upsert({
    where: { userId_challengeId: { userId: user.id, challengeId: id } },
    create: { userId: user.id, challengeId: id },
    update: {},
  })

  return NextResponse.json({ participant })
}
