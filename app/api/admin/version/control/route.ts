import { NextRequest, NextResponse } from "next/server"
import { apiError, requireAdmin } from "@/lib/server/api"
import {
  cancelScheduledUpdate,
  forceUpdateAll,
  getDeploymentStatus,
  scheduleUpdate,
  toggleFlag,
} from "@/lib/admin/deployment-service"

export const dynamic = "force-dynamic"

const FLAG_NAME = /^[a-z0-9_]{2,40}$/

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  return NextResponse.json(await getDeploymentStatus())
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin()
  if (error || !user) return error

  let body: { action?: string; scheduledFor?: string; id?: string; flagName?: string; enabled?: boolean }
  try {
    body = await req.json()
  } catch {
    return apiError("JSON inválido")
  }

  switch (body.action) {
    case "FORCE_UPDATE": {
      const at = await forceUpdateAll(user.id)
      return NextResponse.json({ ok: true, forceUpdateAt: at })
    }
    case "SCHEDULE_UPDATE": {
      const when = body.scheduledFor ? new Date(body.scheduledFor) : null
      if (!when || Number.isNaN(when.getTime())) return apiError("Fecha no válida")
      if (when.getTime() < Date.now() + 60_000) return apiError("La fecha debe ser al menos 1 minuto en el futuro")
      const scheduled = await scheduleUpdate(when)
      return NextResponse.json({ ok: true, scheduled })
    }
    case "CANCEL_SCHEDULED": {
      if (!body.id) return apiError("Falta id")
      await cancelScheduledUpdate(body.id)
      return NextResponse.json({ ok: true })
    }
    case "TOGGLE_FLAG": {
      if (!body.flagName || !FLAG_NAME.test(body.flagName) || typeof body.enabled !== "boolean") {
        return apiError("Flag no válido")
      }
      if (body.flagName === "force_update") return apiError("Usa la acción FORCE_UPDATE")
      const flag = await toggleFlag(body.flagName, body.enabled)
      return NextResponse.json({ ok: true, flag })
    }
    default:
      return apiError("Acción desconocida")
  }
}
