import { prisma } from "@/lib/server/prisma"

export async function auditAdminAction(options: {
  userId: string
  method: string
  path: string
  status: number
  details?: Record<string, any>
}) {
  await prisma.adminAuditLog.create({
    data: {
      userId: options.userId,
      method: options.method,
      path: options.path,
      status: options.status,
      details: options.details || undefined,
    },
  })
}
