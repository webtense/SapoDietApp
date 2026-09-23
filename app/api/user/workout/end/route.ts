import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { endWorkoutSession } from "@/lib/training/service"
import { z } from "zod"

const endSchema = z.object({
  sessionId: z.string(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = endSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  try {
    const session = await endWorkoutSession(
      user.id,
      parsed.data.sessionId,
      parsed.data.notes
    )

    return NextResponse.json({ ok: true, session })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error ending session"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
