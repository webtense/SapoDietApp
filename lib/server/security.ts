import { cookies } from "next/headers"
import { prisma } from "@/lib/server/prisma"
import { createSessionToken, hashToken, sanitizeText } from "@/lib/server/security-utils"

export { createSessionToken, hashToken, sanitizeText } from "@/lib/server/security-utils"

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "sapofit_session"
const SESSION_DAYS = Number.parseInt(process.env.SESSION_DAYS || "7", 10)

export async function createSession(userId: string) {
  const token = createSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  })

  if (!session) return null

  if (session.expiresAt < new Date()) {
    // Borrar la fila de sesión en BD es una operación de servidor legítima
    // (no toca cookies), pero NO intentamos borrar la cookie aquí: getSessionUser()
    // se invoca desde Server Components (páginas/layouts) durante el renderizado,
    // donde Next.js App Router prohíbe modificar cookies y lanza una excepción no
    // capturable que provoca un 500 real. El borrado de la cookie en el navegador
    // ya ocurre solo, porque se creó con `expires: expiresAt` igual a `Session.expiresAt`
    // (ver createSession). El borrado activo, cuando hace falta, se hace en
    // clearSession() desde un Route Handler (p.ej. app/api/auth/logout).
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null)
    return null
  }

  return session.user
}

export async function clearSession() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (raw) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(raw) } })
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function markUserLoggedIn(userId: string, ip?: string | null, userAgent?: string | null) {
  const now = new Date()
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { lastLoginAt: now } }),
    prisma.loginEvent.create({
      data: {
        userId,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    }),
  ])
}
