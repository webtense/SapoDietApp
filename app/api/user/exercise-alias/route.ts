import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")
  if (!gymId) return apiError("Falta gymId")

  const aliases = await prisma.exerciseAlias.findMany({
    where: { userId: user.id, gymMachine: { gymId } },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ aliases })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || typeof body.gymMachineId !== "string") {
    return apiError("Datos de alias inválidos")
  }

  const alias = typeof body.alias === "string" ? body.alias.trim() : ""
  if (alias.length > 60) {
    return apiError("El alias no puede superar los 60 caracteres")
  }

  const gymMachine = await prisma.gymMachine.findUnique({
    where: { id: body.gymMachineId },
  })
  if (!gymMachine) return apiError("Máquina no encontrada", 404)

  if (!alias) {
    await prisma.exerciseAlias.deleteMany({
      where: { userId: user.id, gymMachineId: body.gymMachineId },
    })
    return NextResponse.json({ alias: null })
  }

  const entry = await prisma.exerciseAlias.upsert({
    where: { userId_gymMachineId: { userId: user.id, gymMachineId: body.gymMachineId } },
    create: { userId: user.id, gymMachineId: body.gymMachineId, alias },
    update: { alias },
  })

  return NextResponse.json({ alias: entry })
}
