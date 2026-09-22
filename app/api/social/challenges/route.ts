import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireAdmin, requireUser } from "@/lib/server/api"

const CHALLENGE_TYPES = ["ENTRENAMIENTOS_SEMANA", "RACHA_DIAS", "VOLUMEN_TOTAL", "MINUTOS_ACTIVOS"]

export async function GET() {
  const { error } = await requireUser()
  if (error) return error

  const challenges = await prisma.challenge.findMany({
    orderBy: { fechaInicio: "desc" },
    include: { _count: { select: { participantes: true } } },
  })

  return NextResponse.json({ challenges })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (
    !body ||
    typeof body.nombre !== "string" ||
    !CHALLENGE_TYPES.includes(body.tipo) ||
    typeof body.objetivo !== "number" ||
    !body.fechaInicio ||
    !body.fechaFin
  ) {
    return apiError("Datos de reto inválidos")
  }

  const challenge = await prisma.challenge.create({
    data: {
      nombre: body.nombre.slice(0, 120),
      tipo: body.tipo,
      objetivo: body.objetivo,
      fechaInicio: new Date(body.fechaInicio),
      fechaFin: new Date(body.fechaFin),
    },
  })

  return NextResponse.json({ challenge })
}
