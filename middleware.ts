import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/invite/accept",
  "/api/auth/set-password",
  "/api/health",
  "/api/cron/",
]

export function middleware(req: NextRequest) {
  const response = NextResponse.next()
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  if (req.nextUrl.pathname.startsWith("/api")) {
    const isPublic = PUBLIC_API_PATHS.some((path) => req.nextUrl.pathname.startsWith(path))
    if (!isPublic) {
      const hasSession = req.cookies.has(process.env.SESSION_COOKIE_NAME || "sapofit_session")
      if (!hasSession) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
