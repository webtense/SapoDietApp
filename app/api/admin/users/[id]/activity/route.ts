import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"

export async function GET(_: Request, { params }: any) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const found = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      lastLoginAt: true,
      loginEvents: {
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  })

  if (!found) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: found.id,
      email: found.email,
      name: found.name,
      lastLoginAt: found.lastLoginAt,
    },
    loginEvents: found.loginEvents,
  })
}
