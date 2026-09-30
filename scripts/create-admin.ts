import { hash } from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = "admin@sapofit.local"
  const adminPassword = "3802Mario!"

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log("✅ Admin ya existe:", adminEmail)
    return
  }

  const hashedPassword = await hash(adminPassword, 10)

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      profile: {
        create: {
          weight: 75,
          height: 170,
          gender: "MALE",
          dietType: "BALANCED",
          onboardingCompleted: true,
        },
      },
    },
  })

  console.log("✅ Admin creado:", admin.email, "ID:", admin.id)
}

main()
  .catch((e) => console.error("❌ Error:", e.message))
  .finally(() => prisma.$disconnect())
