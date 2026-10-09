import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const attendances = [
  { date: "2026-10-08", start: "08:00", end: "09:15" },
  { date: "2026-10-06", start: "07:59", end: "09:14" },
  { date: "2026-10-05", start: "08:26", end: "09:41" },
  { date: "2026-10-02", start: "08:00", end: "09:15" },
  { date: "2026-10-01", start: "07:49", end: "09:04" },
  { date: "2026-09-28", start: "08:03", end: "09:18" },
  { date: "2026-09-25", start: "07:59", end: "09:14" },
  { date: "2026-09-23", start: "08:03", end: "09:18" },
  { date: "2026-09-21", start: "08:01", end: "09:16" },
  { date: "2026-09-18", start: "08:01", end: "09:16" },
  { date: "2026-09-14", start: "08:00", end: "09:15" },
  { date: "2026-09-07", start: "08:00", end: "09:15" },
  { date: "2026-09-04", start: "08:05", end: "09:20" },
  { date: "2026-08-31", start: "08:02", end: "09:17" },
]

async function main() {
  console.log("🏋️ Importando asistencias al gimnasio...")

  // Obtener el primer usuario (asume que hay al menos uno)
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
  })

  if (!user) {
    console.error("❌ No hay usuarios. Crea una cuenta primero.")
    process.exit(1)
  }

  console.log(`👤 Importando para usuario: ${user.email}`)

  let created = 0
  for (const att of attendances) {
    const startTime = new Date(`${att.date}T${att.start}:00Z`)
    const endTime = new Date(`${att.date}T${att.end}:00Z`)
    const durationMin = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    try {
      await prisma.gymAttendance.upsert({
        where: {
          id: `${user.id}-${att.date}-planet-fitness`.replace(/\s+/g, "-"),
        },
        create: {
          userId: user.id,
          date: new Date(`${att.date}T00:00:00Z`),
          startTime,
          endTime,
          durationMin,
          gym: "Planet Fitness Via Sabadell, Barcelona",
        },
        update: {
          startTime,
          endTime,
          durationMin,
        },
      })
      created++
    } catch (err) {
      console.error(`Error en ${att.date}:`, err)
    }
  }

  console.log(`✅ ${created}/${attendances.length} asistencias importadas`)

  // Mostrar estadísticas
  const stats = await prisma.gymAttendance.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  })

  if (stats.length > 0) {
    const totalMin = stats.reduce((sum, a) => sum + a.durationMin, 0)
    const avgMin = Math.round(totalMin / stats.length)
    console.log(
      `📊 Total: ${stats.length} sesiones | ${totalMin} min | Promedio: ${avgMin} min/sesión`
    )
  }

  await prisma.$disconnect()
}

main()
  .catch((err) => {
    console.error("Error:", err)
    process.exit(1)
  })
