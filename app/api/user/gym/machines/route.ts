import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { searchParams } = new URL(req.url)
  const group = searchParams.get("group") // "UPPER" | "LOWER"

  try {
    const machines = await prisma.gymMachine.findMany({
      where: group
        ? {
            machineModel: {
              group: group.toUpperCase(),
            },
          }
        : undefined,
      include: {
        machineModel: {
          select: {
            id: true,
            name: true,
            group: true,
            description: true,
            instructions: true,
            tips: true,
            recommendedWeight: true,
          },
        },
        gym: {
          select: { id: true, name: true },
        },
      },
      orderBy: { machineModel: { name: "asc" } },
    })

    return NextResponse.json({ ok: true, machines })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error loading machines"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
