import { NextResponse } from "next/server"
import { apiError, requireAdmin } from "@/lib/server/api"
import { createDatabaseBackup } from "@/lib/backup"

export const runtime = "nodejs"

export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const log = await createDatabaseBackup("MANUAL")
    return NextResponse.json({ log })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    return apiError(`Fallo en el backup: ${message}`, 500)
  }
}
