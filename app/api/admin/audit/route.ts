import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"

export async function GET(req: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error || !admin) return error

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 200)
  const offset = Math.max(Number(req.nextUrl.searchParams.get("offset")) || 0, 0)
  const method = req.nextUrl.searchParams.get("method") || undefined
  const path = req.nextUrl.searchParams.get("path") || undefined

  const where = {
    ...(method ? { method } : {}),
    ...(path ? { path: { contains: path } } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        createdAt: true,
        method: true,
        path: true,
        status: true,
        details: true,
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.adminAuditLog.count({ where }),
  ])

  return NextResponse.json({ ok: true, logs, total })
}
