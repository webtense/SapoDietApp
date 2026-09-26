import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { getSubstitutionsForGroup } from "@/lib/nutrition/service"
import { z } from "zod"

const substituteSchema = z.object({
  groupName: z.string().min(1), // Ej: "PROTEINA_BLANCA"
})

// Devuelve las alternativas disponibles dentro del mismo SubstitutionGroup
// para poder intercambiar un ingrediente de una comida por otro equivalente.
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = substituteSchema.safeParse(body)
  if (!parsed.success) return apiError("Datos de sustitución inválidos")

  try {
    const group = await getSubstitutionsForGroup(parsed.data.groupName)
    if (!group) return apiError("Grupo de sustitución no encontrado", 404)
    return NextResponse.json({ ok: true, group })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error buscando sustituciones"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
