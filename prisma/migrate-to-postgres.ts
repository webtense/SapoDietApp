import { Pool } from "pg"
import Database from "better-sqlite3"
import path from "path"

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

function sqliteModelName(model: (typeof MODELS)[number]) {
  return model.charAt(0).toLowerCase() + model.slice(1)
}

async function migrateModel(sqlite: Database.Database, pg: Pool, model: (typeof MODELS)[number]) {
  const table = sqliteModelName(model)
  const rows: any[] = sqlite.prepare(`SELECT * FROM "${table}"`).all()
  if (rows.length === 0) {
    console.log(`  ${model}: 0 registros, omitido`)
    return
  }

  const columns = Object.keys(rows[0])
  const setClause = columns.filter((c) => c !== "id").map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ")
  const insertCols = columns.map((c) => `"${c}"`).join(", ")
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ")

  let succeeded = 0
  let failed = 0
  for (const row of rows) {
    try {
      const values = columns.map((c) => {
        const v = (row as any)[c]
        if (typeof v === "bigint") return Number(v)
        return v
      })
      await pg.query(
        `INSERT INTO "${table}" (${insertCols}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${setClause}`,
        values,
      )
      succeeded++
    } catch (err) {
      failed++
    }
  }

  console.log(`  ${model}: ${succeeded} migrados${failed > 0 ? `, ${failed} errores` : ""}`)
}

async function main() {
  const pgUrl = process.env.DATABASE_URL
  const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, "dev.db")

  if (!pgUrl) {
    console.error("ERROR: DATABASE_URL (PostgreSQL) no está definido.")
    console.error("Ejemplo: DATABASE_URL='postgresql://user:pass@localhost:5432/sapofit'")
    process.exit(1)
  }

  console.log("=== SapoFit: Migración SQLite → PostgreSQL ===")
  console.log("")
  console.log("ATENCIÓN: haz un backup antes de continuar.")
  console.log("")

  const confirm = process.argv.includes("--confirm")
  if (!confirm) {
    console.log("Ejecuta con --confirm para confirmar la migración:")
    console.log("  npx tsx prisma/migrate-to-postgres.ts --confirm")
    console.log("")
    console.log("Saliendo sin cambios.")
    process.exit(0)
  }

  console.log(`Origen  (SQLite):  ${sqlitePath}`)
  console.log(`Destino (PG):     ${pgUrl}`)
  console.log("")

  const sqlite = new Database(sqlitePath)
  console.log("  Conexión a SQLite: OK")

  const pg = new Pool({ connectionString: pgUrl })
  try {
    await pg.query("SELECT 1")
    console.log("  Conexión a PostgreSQL: OK")
  } catch (err) {
    console.error("ERROR: No se pudo conectar a PostgreSQL:", err)
    process.exit(1)
  }

  console.log("")
  console.log("Migrando modelos...")
  for (const model of MODELS) {
    await migrateModel(sqlite, pg, model)
  }

  console.log("")
  console.log("Migración completada.")

  sqlite.close()
  await pg.end()
}

main().catch((err) => {
  console.error("ERROR fatal:", err)
  process.exit(1)
})
