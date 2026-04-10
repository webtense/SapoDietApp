import { PrismaClient as SqlitePrisma } from "@prisma/client"
import { PrismaClient as PgPrisma } from "@prisma-client-pg"
import { hash, compare } from "bcryptjs"

const sqlite = new SqlitePrisma()
const pg = new PgPrisma()

const MODELS = [
  "User",
  "Session",
  "Invitation",
  "LoginEvent",
  "UserModule",
  "UserPricing",
  "Profile",
  "Goal",
  "MealPlan",
  "MealLog",
  "ExerciseLog",
  "ShoppingList",
  "ShoppingItem",
  "DailyLog",
  "Reminder",
  "RateLimitBucket",
] as const

async function migrateModel(model: (typeof MODELS)[number]) {
  const records = await (sqlite as any)[model.charAt(0).toLowerCase() + model.slice(1)].findMany()
  if (records.length === 0) {
    console.log(`  ${model}: 0 registros, omitido`)
    return
  }

  const results = await Promise.allSettled(
    records.map((record: any) =>
      (pg as any)[model.charAt(0).toLowerCase() + model.slice(1)].upsert({
        where: { id: record.id },
        update: record,
        create: record,
      }),
    ),
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length
  console.log(`  ${model}: ${succeeded} migrados${failed > 0 ? `, ${failed} errores` : ""}`)
  if (failed > 0) {
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .slice(0, 3)
      .map((r) => r.reason?.message || String(r.reason))
    console.log(`    Primeros errores: ${errors.join("; ")}`)
  }
}

async function main() {
  const sqliteUrl = process.env.SQLITE_URL || "file:./prisma/dev.db"
  const pgUrl = process.env.DATABASE_URL

  if (!pgUrl) {
    console.error("ERROR: DATABASE_URL (PostgreSQL) no está definido.")
    console.error("Ejemplo: DATABASE_URL='postgresql://user:pass@localhost:5432/sapofit'")
    process.exit(1)
  }

  console.log("=== SapoFit: Migración SQLite → PostgreSQL ===")
  console.log("")
  console.log("ATENCIÓN: haz un backup de la base de datos antes de continuar.")
  console.log("")

  const confirm = process.argv.includes("--confirm")
  if (!confirm) {
    console.log("Ejecuta con --confirm para confirmar la migración:")
    console.log("  npx tsx prisma/migrate-to-postgres.ts --confirm")
    console.log("")
    console.log("Saliendo sin cambios.")
    process.exit(0)
  }

  console.log(`Origen  (SQLite):  ${sqliteUrl}`)
  console.log(`Destino (PG):     ${pgUrl}`)
  console.log("")

  console.log("Creando esquema en PostgreSQL...")
  try {
    await pg.$connect()
    console.log("  Conexión a PostgreSQL: OK")
  } catch (err) {
    console.error("ERROR: No se pudo conectar a PostgreSQL:", err)
    process.exit(1)
  }

  console.log("")
  console.log("Migrando modelos...")
  for (const model of MODELS) {
    await migrateModel(model)
  }

  console.log("")
  console.log("Migración completada.")

  await sqlite.$disconnect()
  await pg.$disconnect()
}

main().catch((err) => {
  console.error("ERROR fatal:", err)
  process.exit(1)
})
