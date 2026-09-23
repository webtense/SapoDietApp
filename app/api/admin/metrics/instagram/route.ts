import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, apiError } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { sanitizeText } from "@/lib/server/security"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const posts = await prisma.instagramPost.findMany({
    orderBy: { postedAt: "desc" },
    take: 50,
  })
  return NextResponse.json({ ok: true, posts })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return apiError("Cuerpo inválido")

  const caption = body.caption ? sanitizeText(String(body.caption)).slice(0, 2000) : null
  const permalink = body.permalink ? String(body.permalink).slice(0, 500) : null
  const imageUrl = body.imageUrl ? String(body.imageUrl).slice(0, 500) : null
  const likes = Number(body.likes) || 0
  const comments = Number(body.comments) || 0
  const postedAt = body.postedAt ? new Date(body.postedAt) : new Date()

  if (Number.isNaN(postedAt.getTime())) return apiError("Fecha de publicación inválida")

  const post = await prisma.instagramPost.create({
    data: { caption, permalink, imageUrl, likes, comments, postedAt, source: "MANUAL" },
  })

  return NextResponse.json({ ok: true, post })
}
