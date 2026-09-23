import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { addPantryItem, getPantry } from "@/lib/nutrition/service"
import { z } from "zod"

const pantrySchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = pantrySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid pantry item" }, { status: 400 })
  }

  try {
    const item = await addPantryItem(
      user.id,
      parsed.data.name,
      parsed.data.quantity,
      parsed.data.unit,
      parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined
    )
    return NextResponse.json({ ok: true, item }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error adding pantry item"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  try {
    const items = await getPantry(user.id)
    return NextResponse.json({ ok: true, items })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error loading pantry"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
