import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const gyms = await prisma.gym.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ ok: true, gyms })
  } catch (err) {
    return NextResponse.json(
      { error: "Error loading gyms" },
      { status: 400 }
    )
  }
}
