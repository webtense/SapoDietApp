import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

/**
 * Script para sincronizar datos offline del 01/10/2026
 * Uso: npx tsx scripts/sync-offline-data.ts
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function syncOfflineData() {
  console.log("📱 Sincronizando datos offline (01/10/2026)...")

  try {
    // 1. Obtener usuario admin
    const user = await prisma.user.findUnique({
      where: { email: "admin@sapofit.local" },
    })

    if (!user) {
      throw new Error("Usuario admin no encontrado")
    }

    console.log(`✅ Usuario encontrado: ${user.email}`)

    // 2. Crear sesión de entrenamiento
    const session = await prisma.workoutSession.create({
      data: {
        userId: user.id,
        date: new Date("2026-10-01"),
        notes: "Sesión offline 01/10/2026 (sincronizada automáticamente)",
      },
    })

    console.log(`✅ Sesión creada: ${session.id}`)

    // 3. Crear máquinas (si no existen)
    const machine27kg = await prisma.machine.upsert({
      where: { name: "Dumbbell 27kg" },
      update: {},
      create: {
        name: "Dumbbell 27kg",
        category: "WEIGHT",
        description: "Mancuerna 27kg",
      },
    })

    const machine32kg = await prisma.machine.upsert({
      where: { name: "Dumbbell 32kg" },
      update: {},
      create: {
        name: "Dumbbell 32kg",
        category: "WEIGHT",
        description: "Mancuerna 32kg (27kg + 5kg)",
      },
    })

    console.log(`✅ Máquinas creadas/actualizadas`)

    // 4. Crear ejercicios
    const exercise1 = await prisma.workoutExercise.create({
      data: {
        sessionId: session.id,
        machineId: machine27kg.id,
        notes: "Set 1: 27kg - Perdió 2 reps",
      },
    })

    const exercise2 = await prisma.workoutExercise.create({
      data: {
        sessionId: session.id,
        machineId: machine32kg.id,
        notes: "Set 2: 27kg+5kg - Nueva máquina",
      },
    })

    console.log(`✅ Ejercicios creados`)

    // 5. Crear sets
    const set1 = await prisma.workoutSet.create({
      data: {
        exerciseId: exercise1.id,
        repsTarget: 12,
        repsActual: 10,
        weight: 27.0,
        notes: "12x27 -2 Rep",
      },
    })

    const set2 = await prisma.workoutSet.create({
      data: {
        exerciseId: exercise2.id,
        repsTarget: 12,
        repsActual: 1,
        weight: 32.0,
        notes: "12x27+5 1 Rep",
      },
    })

    console.log(`✅ Sets creados`)

    // 6. Resumen
    console.log(`
╔════════════════════════════════════════╗
║  ✅ SINCRONIZACIÓN COMPLETADA          ║
╚════════════════════════════════════════╝

📊 Resumen:
  • Sesión: ${session.id}
  • Fecha: 2026-10-01
  • Usuario: ${user.email}

💪 Entrenamientos:
  • Set 1: 27kg x10 reps (perdió 2)
  • Set 2: 32kg x1 rep

🔄 Estado: ✅ Sincronizado en BD
`)

    return { success: true, sessionId: session.id }
  } catch (error) {
    console.error(`\n❌ Error sincronizando:`, error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

syncOfflineData()
