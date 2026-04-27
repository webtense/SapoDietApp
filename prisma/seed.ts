import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import { DEFAULT_MODULE_KEYS } from "../lib/constants/modules"

const prisma = new PrismaClient()

async function upsertAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
  const adminName = process.env.ADMIN_NAME || "Admin"
  const rawPassword = process.env.ADMIN_PASSWORD
  const passwordHash = rawPassword ? await hash(rawPassword, 12) : undefined

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
      name: adminName,
      displayName: adminName,
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      displayName: adminName,
      role: "ADMIN",
      status: "ACTIVE",
      profile: { create: {} },
      goal: { create: {} },
    },
    include: { modules: true },
  })

  if (!admin.passwordHash && passwordHash) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash },
    })
  }

  await Promise.all(
    DEFAULT_MODULE_KEYS.map((moduleKey) =>
      prisma.userModule.upsert({
        where: { userId_moduleKey: { userId: admin.id, moduleKey } },
        update: { enabled: true },
        create: { userId: admin.id, moduleKey, enabled: true },
      }),
    ),
  )

  await prisma.userPricing.upsert({
    where: { userId: admin.id },
    update: { label: "Administrador" },
    create: {
      userId: admin.id,
      label: "Administrador",
      monthlyPrice: 0,
      notes: "Cuenta maestra",
    },
  })

  console.log(`Usuario admin asegurado: ${adminEmail}`)
  if (!rawPassword) {
    console.warn("ADMIN_PASSWORD no está definido; si el usuario ya existía, se conserva su contraseña actual.")
  }
}

async function main() {
  await upsertAdminUser()
  console.log("Seed inicial completado")
}

main()
  .catch((error) => {
    console.error("Error en seed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
