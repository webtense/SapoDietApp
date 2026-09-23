import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/api"
import { apiError } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { sanitizeText } from "@/lib/server/security"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json({ ok: true, reviews })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return apiError("Cuerpo inválido")

  const name = sanitizeText(String(body.name || "")).slice(0, 120)
  const rating = Number(body.rating)
  const comment = body.comment ? sanitizeText(String(body.comment)).slice(0, 2000) : null

  if (!name) return apiError("El nombre es obligatorio")
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return apiError("La valoración debe ser un entero entre 1 y 5")
  }

  const review = await prisma.review.create({
    data: { name, rating, comment, source: "MANUAL", approved: true },
  })

  return NextResponse.json({ ok: true, review })
}
