import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { adminUpdateUserSchema } from "@/lib/validation"

export async function PATCH(req: NextRequest, { params }: any) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = adminUpdateUserSchema.safeParse({ ...(body || {}), userId: params.id })
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.email) updates.email = parsed.data.email.trim().toLowerCase()
  if (parsed.data.name) {
    updates.name = parsed.data.name
    updates.displayName = parsed.data.name
  }
  if (parsed.data.status) updates.status = parsed.data.status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  await prisma.user.update({ where: { id: params.id }, data: updates })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: any) {
  const { user: admin, error } = await requireAdmin()
  if (error || !admin) return error

  const targetUser = await prisma.user.findUnique({ where: { id: params.id } })
  if (!targetUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  if (targetUser.role === "ADMIN") {
    return NextResponse.json({ error: "No puedes eliminar un administrador" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true, message: "Usuario eliminado" })
}
