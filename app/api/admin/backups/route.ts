import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const backups = await prisma.backupLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ backups })
}
