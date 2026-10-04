import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/server/security"
import { auditAdminAction } from "@/lib/server/admin-audit"

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

export async function withAdminAudit(options: {
  userId: string
  method: string
  path: string
  handler: () => Promise<Response>
}): Promise<Response> {
  try {
    const response = await options.handler()
    const status = response.status

    auditAdminAction({
      userId: options.userId,
      method: options.method,
      path: options.path,
      status,
    }).catch((err) => console.error("Error registrando auditoría admin:", err))

    return response
  } catch (error) {
    auditAdminAction({
      userId: options.userId,
      method: options.method,
      path: options.path,
      status: 500,
      details: { error: (error as Error).message },
    }).catch((err) => console.error("Error registrando auditoría admin:", err))
    throw error
  }
}
