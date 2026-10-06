import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { apiError, requireUser } from "@/lib/server/api"
import { healthTokenCreateSchema } from "@/lib/validation"
import { createHealthToken } from "@/lib/server/health-import"

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const tokens = await prisma.healthToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
  })

  return NextResponse.json({ tokens })
}

/** Genera un token personal de salud. El valor en claro solo se devuelve aquí, una vez. */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = healthTokenCreateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError("Etiqueta inválida", 400)
  }

  const { raw, token } = await createHealthToken(user.id, parsed.data.label)

  return NextResponse.json({
    token: raw,
    id: token.id,
    label: token.label,
    createdAt: token.createdAt,
  })
}
