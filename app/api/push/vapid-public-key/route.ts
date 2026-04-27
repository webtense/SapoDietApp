import { NextResponse } from "next/server"
import { getVapidPublicKey } from "@/lib/server/push"

export async function GET() {
  const publicKey = getVapidPublicKey()

  if (!publicKey) {
    return NextResponse.json({ error: "VAPID_PUBLIC_KEY no configurada" }, { status: 503 })
  }

  return NextResponse.json({ publicKey })
}
