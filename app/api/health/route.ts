import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, service: "sapofit", database: "ok" })
  } catch {
    return NextResponse.json({ ok: false, service: "sapofit", database: "error" }, { status: 503 })
  }
}
