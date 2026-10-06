import { NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { revokeHealthToken } from "@/lib/server/health-import"

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  const revoked = await revokeHealthToken(user.id, params.id)
  if (!revoked) return apiError("Token no encontrado", 404)

  return NextResponse.json({ ok: true })
}
