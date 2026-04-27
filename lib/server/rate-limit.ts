import { prisma } from "@/lib/server/prisma"

export async function checkRateLimit(key: string, limit = 15, windowMs = 60_000) {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  await prisma.rateLimitBucket.deleteMany({
    where: {
      resetAt: { lt: now },
    },
  })

  return prisma.$transaction(async (tx) => {
    const current = await tx.rateLimitBucket.findUnique({ where: { key } })

    if (!current) {
      await tx.rateLimitBucket.create({
        data: {
          key,
          count: 1,
          resetAt,
        },
      })

      return { allowed: true, remaining: limit - 1 }
    }

    if (current.resetAt < now) {
      await tx.rateLimitBucket.update({
        where: { key },
        data: {
          count: 1,
          resetAt,
        },
      })

      return { allowed: true, remaining: limit - 1 }
    }

    if (current.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((current.resetAt.getTime() - now.getTime()) / 1000),
      }
    }

    const updated = await tx.rateLimitBucket.update({
      where: { key },
      data: {
        count: { increment: 1 },
      },
    })

    return { allowed: true, remaining: Math.max(limit - updated.count, 0) }
  })
}
