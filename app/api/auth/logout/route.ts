import { NextResponse } from "next/server"
import { clearSession } from "@/lib/server/security"

export async function POST() {
  await clearSession()
  return NextResponse.json({ ok: true })
}
