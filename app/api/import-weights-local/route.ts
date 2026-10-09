import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/server/prisma'
import fs from 'fs'
import path from 'path'

// ⚠️ TEMPORAL: Endpoint para importar pesos localmente (sin auth)
// Eliminar después de usar
export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (token !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    const body = await req.json()
    const { userId } = body

    // Obtener el usuario
    let targetUser = null
    if (userId) {
      targetUser = await prisma.user.findUnique({ where: { id: userId } })
    } else {
      // Si no se especifica, usar el primer usuario (admin)
      targetUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        orderBy: { createdAt: 'asc' },
      })
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`📊 Importando pesos para: ${targetUser.email}`)

    let created = 0
    let updated = 0
    let errors = 0

    const weights = body.weights || []

    for (const item of weights) {
      try {
        const { date, weight } = item
        if (!date || !weight || weight < 30 || weight > 300) {
          errors++
          continue
        }

        const dateObj = new Date(`${date}T00:00:00Z`)
        const dateIso = date

        // WeightEntry
        const existing = await prisma.weightEntry.findFirst({
          where: {
            userId: targetUser.id,
            date: {
              gte: new Date(`${dateIso}T00:00:00Z`),
              lt: new Date(`${dateIso}T23:59:59Z`),
            },
          },
        })

        if (existing) {
          await prisma.weightEntry.update({
            where: { id: existing.id },
            data: { weight },
          })
          updated++
        } else {
          await prisma.weightEntry.create({
            data: {
              userId: targetUser.id,
              date: dateObj,
              weight,
            },
          })
          created++
        }

        // DailyLog
        const dailyLog = await prisma.dailyLog.findUnique({
          where: {
            userId_date: {
              userId: targetUser.id,
              date: dateIso,
            },
          },
        })

        if (dailyLog) {
          await prisma.dailyLog.update({
            where: {
              userId_date: {
                userId: targetUser.id,
                date: dateIso,
              },
            },
            data: { weightKg: weight },
          })
        } else {
          await prisma.dailyLog.create({
            data: {
              userId: targetUser.id,
              date: dateIso,
              weightKg: weight,
            },
          })
        }
      } catch (err: any) {
        console.error('Error:', err.message)
        errors++
      }
    }

    // Stats
    const allWeights = await prisma.weightEntry.findMany({
      where: { userId: targetUser.id },
      select: { weight: true, date: true },
      orderBy: { date: 'desc' },
    })

    const stats: any = {
      created,
      updated,
      errors,
      totalRecords: allWeights.length,
    }

    if (allWeights.length > 0) {
      const weights = allWeights.map(w => w.weight).sort((a, b) => a - b)
      stats.min = Math.round(weights[0] * 10) / 10
      stats.max = Math.round(weights[weights.length - 1] * 10) / 10
      stats.avg = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10
      stats.lastDate = allWeights[0]?.date?.toISOString().split('T')[0]
      stats.firstDate = allWeights[allWeights.length - 1]?.date?.toISOString().split('T')[0]
    }

    return NextResponse.json({
      success: true,
      message: `Importados ${created + updated} pesos`,
      stats,
    })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: 'Import failed: ' + err.message },
      { status: 500 }
    )
  }
}
