import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"
import { refreshChallengeProgress } from "@/lib/social/service"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser()
  if (error) return error

  const { id } = await params
  await refreshChallengeProgress(id)

  const participant = await prisma.userChallenge.findUnique({
    where: { userId_challengeId: { userId: user.id, challengeId: id } },
  })
  if (!participant) return apiError("No participas en este reto", 404)

  return NextResponse.json({ participant })
}
