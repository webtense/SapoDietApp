import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { getCurrentWorkout } from "@/lib/training/service"

export async function GET() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  try {
    const result = await getCurrentWorkout(user.id)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[workout/current]", err)
    return NextResponse.json({ error: "Error obteniendo el entrenamiento actual" }, { status: 500 })
  }
}
