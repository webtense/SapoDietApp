import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/server/security"

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) {
    return { error: apiError("No autenticado", 401), user: null as null }
  }
  return { error: undefined, user }
}

export async function requireAdmin() {
  const { user, error } = await requireUser()
  if (error || !user) {
    return { error: error ?? apiError("No autenticado", 401), user: null as null }
  }
  if (user.role !== "ADMIN") {
    return { error: apiError("No autorizado", 403), user: null as null }
  }
  return { error: undefined, user }
}
