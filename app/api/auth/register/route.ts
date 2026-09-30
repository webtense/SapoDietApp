import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Contraseña muy corta" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 })
    }

    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "USER",
        profile: {
          create: {
            weight: 75,
            height: 170,
            gender: "MALE",
            dietType: "BALANCED",
            onboardingCompleted: false,
          },
        },
      },
      include: { profile: true },
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Error al registrarse" }, { status: 500 })
  }
}
