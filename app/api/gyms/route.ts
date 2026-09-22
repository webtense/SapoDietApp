import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireUser } from "@/lib/server/api"

export async function GET() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const gyms = await prisma.gym.findMany({
    orderBy: { name: "asc" },
    include: {
      machines: {
        include: { machineModel: true },
      },
    },
  })

  return NextResponse.json({ ok: true, gyms })
}
