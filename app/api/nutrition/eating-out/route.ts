import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { getEatingOutLogs, logEatingOut } from "@/lib/nutrition/service"
import { z } from "zod"

const eatingOutSchema = z.object({
  restaurant: z.string().optional(),
  mealType: z.enum(["COMIDA", "CENA"]),
  selectedOption: z.string().optional(),
  estimatedCalories: z.number().nonnegative().optional(),
  estimatedProtein: z.number().nonnegative().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  try {
    const logs = await getEatingOutLogs(user.id)
    return NextResponse.json({ ok: true, logs })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error cargando registros"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = eatingOutSchema.safeParse(body)
  if (!parsed.success) return apiError("Datos de comida fuera inválidos")

  try {
    const log = await logEatingOut(user.id, parsed.data)
    return NextResponse.json({ ok: true, log }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error registrando comida fuera"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
