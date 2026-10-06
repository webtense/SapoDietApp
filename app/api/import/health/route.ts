import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/server/api"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { healthImportSchema } from "@/lib/validation"
import { importHealthData, verifyHealthToken } from "@/lib/server/health-import"

/**
 * Entrada de datos de salud para Atajos de iOS. Autenticación con token
 * personal Bearer (no sesión): el handler valida su propio token.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || ""
  const [scheme, rawToken] = authHeader.split(" ")
  if (scheme !== "Bearer" || !rawToken) {
    return apiError("Token Bearer requerido", 401)
  }

  const auth = await verifyHealthToken(rawToken)
  if (!auth) {
    return apiError("Token inválido o revocado", 401)
  }

  const rate = await checkRateLimit(`health-import:${auth.tokenId}`, 60, 60 * 60 * 1000)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Inténtalo más tarde." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = healthImportSchema.safeParse(body)
  if (!parsed.success) {
    return apiError("Datos de salud inválidos", 400)
  }

  const result = await importHealthData(auth.userId, parsed.data, "ios-shortcuts")
  return NextResponse.json(result)
}
