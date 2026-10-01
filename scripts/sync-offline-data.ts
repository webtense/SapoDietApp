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
    const dumbbell27 = await prisma.machine.upsert({
      where: { name: "Dumbbell 27kg" },
      update: {},
      create: {
        name: "Dumbbell 27kg",
        category: "WEIGHT",
        description: "Mancuerna 27kg",
      },
    })

    const dumbbell32 = await prisma.machine.upsert({
      where: { name: "Dumbbell 32kg" },
      update: {},
      create: {
        name: "Dumbbell 32kg",
        category: "WEIGHT",
        description: "Mancuerna 32kg (27kg + 5kg)",
      },
    })

    const seatedRow27 = await prisma.machine.upsert({
      where: { name: "Seated Row 27kg" },
      update: {},
      create: {
        name: "Seated Row 27kg",
        category: "CARDIO",
        description: "Remo sentado 27kg",
      },
    })

    const seatedRow32 = await prisma.machine.upsert({
      where: { name: "Seated Row 32kg" },
      update: {},
      create: {
        name: "Seated Row 32kg",
        category: "CARDIO",
        description: "Remo sentado 32kg",
      },
    })

    const seatedRow37 = await prisma.machine.upsert({
      where: { name: "Seated Row 37kg" },
      update: {},
      create: {
        name: "Seated Row 37kg",
        category: "CARDIO",
        description: "Remo sentado 37kg (32kg + 5kg)",
      },
    })

    console.log(`✅ Máquinas creadas/actualizadas`)

    // 4. Crear ejercicios
    // EJERCICIO 1: Pesos (Dumbbell)
    const ex1_set1 = await prisma.workoutExercise.create({
      data: {
        sessionId: session.id,
        machineId: dumbbell27.id,
        notes: "Dumbbell - Set 1: 27kg",
      },
    })

    const ex1_set2 = await prisma.workoutExercise.create({
      data: {
        sessionId: session.id,
        machineId: dumbbell32.id,
        notes: "Dumbbell - Set 2: 27kg+5kg",
      },
    })

    // EJERCICIO 2: Remo Sentado (Seated Row)
    const ex2_set1 = await prisma.workoutExercise.create({
      data: {
        sessionId: session.id,
        machineId: seatedRow27.id,
        notes: "Seated Row - Set 1: 27kg",
      },
    })

    const ex2_set2 = await prisma.workoutExercise.create({
      data: {
        sessionId: session.id,
        machineId: seatedRow32.id,
        notes: "Seated Row - Set 2: 32kg",
      },
    })

    const ex2_set3 = await prisma.workoutExercise.create({
      data: {
        sessionId: session.id,
        machineId: seatedRow37.id,
        notes: "Seated Row - Set 3: 32kg+5kg",
      },
    })

    console.log(`✅ Ejercicios creados (2 ejercicios, 5 sets)`)

    // 5. Crear sets
    // DUMBBELL SETS
    await prisma.workoutSet.create({
      data: {
        exerciseId: ex1_set1.id,
        repsTarget: 12,
        repsActual: 10,
        weight: 27.0,
        notes: "12x27 -2 Rep",
      },
    })

    await prisma.workoutSet.create({
      data: {
        exerciseId: ex1_set2.id,
        repsTarget: 12,
        repsActual: 1,
        weight: 32.0,
        notes: "12x27+5 1 Rep",
      },
    })

    // SEATED ROW SETS
    await prisma.workoutSet.create({
      data: {
        exerciseId: ex2_set1.id,
        repsTarget: 12,
        repsActual: 12,
        weight: 27.0,
        notes: "12x27 ✅",
      },
    })

    await prisma.workoutSet.create({
      data: {
        exerciseId: ex2_set2.id,
        repsTarget: 12,
        repsActual: 12,
        weight: 32.0,
        notes: "12x32 ✅",
      },
    })

    await prisma.workoutSet.create({
      data: {
        exerciseId: ex2_set3.id,
        repsTarget: 12,
        repsActual: 12,
        weight: 37.0,
        notes: "12x32+5 ✅",
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
