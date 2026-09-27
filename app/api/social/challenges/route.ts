import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireAdmin, requireUser } from "@/lib/server/api"

export async function GET() {
  const { error } = await requireUser()
  if (error) return error

  const challenges = await prisma.challenge.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { userChallenges: true } } },
  })

  return NextResponse.json({
    challenges: challenges.map((c) => ({
      ...c,
      _count: { participantes: c._count.userChallenges },
    })),
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || typeof body.nombre !== "string" || !body.nombre.trim()) {
    return apiError("Datos de reto inválidos")
  }
  if (!body.objetivo || !body.fechaInicio || !body.fechaFin) {
    return apiError("Faltan objetivo, fecha de inicio o fecha de fin")
  }

  const challenge = await prisma.challenge.create({
    data: {
      name: body.nombre.slice(0, 120),
      description: typeof body.descripcion === "string" ? body.descripcion.slice(0, 500) : undefined,
      icon: typeof body.icon === "string" ? body.icon.slice(0, 60) : undefined,
      tipo: typeof body.tipo === "string" ? body.tipo : "ENTRENAMIENTOS_SEMANA",
      objetivo: Number(body.objetivo),
      fechaInicio: new Date(body.fechaInicio),
      fechaFin: new Date(body.fechaFin),
    },
  })

  return NextResponse.json({ challenge })
}
