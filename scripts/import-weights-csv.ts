import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

async function main() {
  console.log("📊 Importando pesos desde WeightDrop CSV...")

  // Leer el CSV
  const csvPath = path.join(process.cwd(), "../Downloads/WeightDrop-Export-2026-10-09.csv")
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Archivo no encontrado: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8")
  const lines = csvContent.trim().split("\n")

  // Obtener el primer usuario (asume que hay al menos uno)
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
  })

  if (!user) {
    console.error("❌ No hay usuarios. Crea una cuenta primero.")
    process.exit(1)
  }

  console.log(`👤 Importando pesos para: ${user.email}`)
  console.log(`📁 Total de líneas: ${lines.length - 1}`)

  let created = 0
  let updated = 0
  let errors = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      // Parsear CSV (simple: date,weight,notes)
      const parts = line.split(",")
      const dateStr = parts[0]
      const weight = parseFloat(parts[1])

      if (!dateStr || isNaN(weight)) {
        errors++
        continue
      }

      const date = new Date(`${dateStr}T00:00:00Z`)

      // Crear o actualizar WeightEntry
      const existing = await prisma.weightEntry.findFirst({
        where: {
          userId: user.id,
          date: {
            gte: new Date(dateStr + "T00:00:00Z"),
            lt: new Date(dateStr + "T23:59:59Z"),
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
            userId: user.id,
            date,
            weight,
          },
        })
        created++
      }

      // Actualizar o crear DailyLog.weightKg
      const dailyLog = await prisma.dailyLog.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: date.toISOString().split("T")[0],
          },
        },
      })

      if (dailyLog) {
        await prisma.dailyLog.update({
          where: {
            userId_date: {
              userId: user.id,
              date: date.toISOString().split("T")[0],
            },
          },
          data: { weightKg: weight },
        })
      } else {
        await prisma.dailyLog.create({
          data: {
            userId: user.id,
            date: date.toISOString().split("T")[0],
            weightKg: weight,
          },
        })
      }

      if ((i % 100) === 0) {
        console.log(`  ✓ ${i}/${lines.length - 1}...`)
      }
    } catch (err: any) {
      console.error(`Error en línea ${i}:`, err.message)
      errors++
    }
  }

  console.log(`\n✅ Importación completada:`)
  console.log(`   📍 Creados: ${created}`)
  console.log(`   📝 Actualizados: ${updated}`)
  console.log(`   ❌ Errores: ${errors}`)

  // Mostrar estadísticas
  const stats = await prisma.weightEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 1,
  })

  if (stats.length > 0) {
    console.log(`\n📈 Últimas entradas:`)
    console.log(`   Última: ${stats[0].weight} kg (${stats[0].date.toISOString().split("T")[0]})`)
  }

  const allWeights = await prisma.weightEntry.findMany({
    where: { userId: user.id },
    select: { weight: true },
  })

  if (allWeights.length > 0) {
    const weights = allWeights.map(w => w.weight).sort((a, b) => a - b)
    const min = weights[0]
    const max = weights[weights.length - 1]
    const avg = (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2)
    console.log(`   Mínimo: ${min} kg`)
    console.log(`   Máximo: ${max} kg`)
    console.log(`   Promedio: ${avg} kg`)
    console.log(`   Total de registros: ${weights.length}`)
  }

  await prisma.$disconnect()
}

main()
  .catch((err) => {
    console.error("Error:", err)
    process.exit(1)
  })
