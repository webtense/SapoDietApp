import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"

// TODO: no hay convención de subida de ficheros real en SapoFit (las fotos de comida
// se envían directamente a Gemini sin persistirse en disco/storage). Cuando se defina
// un storage (local disk / S3 / etc.) para BodyPhoto, sustituir filePath por la URL
// real devuelta por el upload y añadir un endpoint POST multipart aquí.

const POSES = ["FRONT", "SIDE", "BACK"] as const

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const photos = await prisma.bodyPhoto.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  })

  return NextResponse.json({ photos })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || !body.date || !body.filePath || !body.fileName || !POSES.includes(body.pose)) {
    return apiError("Datos de foto inválidos")
  }

  const date = new Date(body.date)
  if (Number.isNaN(date.getTime())) return apiError("Fecha inválida")

  const photo = await prisma.bodyPhoto.create({
    data: {
      userId: user.id,
      date,
      pose: body.pose,
      filePath: body.filePath,
      fileName: body.fileName,
      weightEntryId: typeof body.weightEntryId === "string" ? body.weightEntryId : null,
    },
  })

  return NextResponse.json({ photo })
}
