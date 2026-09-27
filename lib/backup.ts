import { execFile } from "node:child_process"
import { promisify } from "node:util"
import fs from "node:fs/promises"
import path from "node:path"
import { prisma } from "@/lib/server/prisma"

const execFileAsync = promisify(execFile)

function backupDir() {
  return process.env.BACKUP_DIR || "/opt/sapofit/backups"
}

export async function createDatabaseBackup(triggeredBy: "MANUAL" | "CRON") {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no configurado")
  }

  const dir = backupDir()
  await fs.mkdir(dir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `sapofit_${timestamp}.dump`
  const filePath = path.join(dir, filename)

  const log = await prisma.backupLog.create({
    data: { status: "RUNNING", trigger: triggeredBy },
  })

  try {
    await execFileAsync("pg_dump", [
      "--dbname", databaseUrl,
      "-Fc",
      "-f", filePath,
    ])

    await fs.stat(filePath)

    return prisma.backupLog.update({
      where: { id: log.id },
      data: {
        status: "SUCCESS",
        backupPath: filePath,
        completedAt: new Date(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.backupLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: message.slice(0, 2000), completedAt: new Date() },
    })
    throw err
  }
}

/**
 * Restaura la base de datos desde un fichero de backup.
 * SOLO para recuperación manual de desastre — nunca se llama automáticamente.
 */
export async function restoreFromBackup(filename: string) {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no configurado")
  }

  const filePath = path.join(/*turbopackIgnore: true*/ backupDir(), filename)
  await fs.access(filePath)

  await execFileAsync("pg_restore", [
    "--dbname", databaseUrl,
    "--clean",
    "--if-exists",
    "--no-owner",
    filePath,
  ])
}
