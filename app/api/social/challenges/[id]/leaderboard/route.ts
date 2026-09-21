import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { getLeaderboard } from "@/lib/social/service"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser()
  if (error) return error

  const { id } = await params
  const leaderboard = await getLeaderboard(id)

  return NextResponse.json({ leaderboard })
}
