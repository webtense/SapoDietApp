import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/server/security'
import { prisma } from '@/lib/server/prisma'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const targetUserId = (formData.get('userId') as string) || user.id

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Leer el archivo
    const text = await file.text()
    const lines = text.trim().split('\n')

    if (lines.length < 2) {
      return NextResponse.json({ error: 'Empty CSV file' }, { status: 400 })
    }

    let created = 0
    let updated = 0
    let errors = 0
    const errorDetails: any[] = []

    // Procesar líneas (saltando header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        // Parsear CSV: date,weight,notes
        const parts = line.split(',')
        const dateStr = parts[0]
        const weight = parseFloat(parts[1])

        if (!dateStr || isNaN(weight) || weight < 30 || weight > 300) {
          errors++
          errorDetails.push({ line: i, reason: 'Invalid date or weight out of range' })
          continue
        }

        const date = new Date(`${dateStr}T00:00:00Z`)
        const dateIso = dateStr

        // Crear o actualizar WeightEntry
        const existing = await prisma.weightEntry.findFirst({
          where: {
            userId: targetUserId,
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
              userId: targetUserId,
              date,
              weight,
            },
          })
          created++
        }

        // Actualizar DailyLog
        const dailyLog = await prisma.dailyLog.findUnique({
          where: {
            userId_date: {
              userId: targetUserId,
              date: dateIso,
            },
          },
        })

        if (dailyLog) {
          await prisma.dailyLog.update({
            where: {
              userId_date: {
                userId: targetUserId,
                date: dateIso,
              },
            },
            data: { weightKg: weight },
          })
        } else {
          await prisma.dailyLog.create({
            data: {
              userId: targetUserId,
              date: dateIso,
              weightKg: weight,
            },
          })
        }
      } catch (err: any) {
        errors++
        errorDetails.push({ line: i, reason: err.message })
      }
    }

    // Calcular estadísticas
    const allWeights = await prisma.weightEntry.findMany({
      where: { userId: targetUserId },
      select: { weight: true, date: true },
      orderBy: { date: 'desc' },
    })

    const stats = {
      created,
      updated,
      errors,
      errorDetails: errors > 0 ? errorDetails.slice(0, 5) : undefined,
      totalRecords: allWeights.length,
      lastDate: allWeights[0]?.date?.toISOString().split('T')[0],
      firstDate: allWeights[allWeights.length - 1]?.date?.toISOString().split('T')[0],
    }

    if (allWeights.length > 0) {
      const weights = allWeights.map(w => w.weight).sort((a, b) => a - b)
      stats.min = Math.round(weights[0] * 10) / 10
      stats.max = Math.round(weights[weights.length - 1] * 10) / 10
      stats.avg = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10
    }

    return NextResponse.json({
      success: true,
      message: `Importados ${created + updated} pesos (${created} nuevos, ${updated} actualizados)`,
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
