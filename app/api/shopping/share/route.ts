import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { evolutionSendText } from "@/lib/server/evolution"
import { createShoppingShare, getOwnedShoppingList } from "@/lib/server/shopping"
import { shoppingShareSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = shoppingShareSchema.safeParse(body)
  if (!parsed.success) return apiError("Datos de compartición inválidos")

  const bucketDay = new Date().toISOString().slice(0, 10)
  const rate = await checkRateLimit(`wa:shopping-share:${user.id}:${bucketDay}`, 5, 86_400_000)
  if (!rate.allowed) {
    return apiError("Has alcanzado el límite diario de envíos por WhatsApp", 429)
  }

  const list = await getOwnedShoppingList(user.id, parsed.data.shoppingListId)
  if (!list) return apiError("Lista no encontrada", 404)

  const share = await createShoppingShare(user.id, list.id, parsed.data.toPhone)
  const appUrl = process.env.APP_URL || "http://localhost:3000"
  const shareUrl = `${appUrl}/compra/compartir/${share.rawToken}`
  const pdfUrl = `${appUrl}/api/shopping/share/${share.rawToken}?format=pdf`
  const message = [
    `Lista de compra SapoFit de ${user.name || "tu contacto"}`,
    `Caduca en 24h: ${share.expiresAt.toLocaleString("es-ES")}`,
    `Abrir lista: ${shareUrl}`,
    `PDF directo: ${pdfUrl}`,
  ].join("\n")

  const result = await evolutionSendText({
    userId: user.id,
    toPhone: parsed.data.toPhone,
    message,
    rawJson: JSON.stringify({ shoppingListId: list.id, shareUrl, pdfUrl }),
  })

  if (!result.ok) return apiError("No se pudo enviar por WhatsApp", 502)

  return NextResponse.json({ ok: true, shareUrl, pdfUrl, expiresAt: share.expiresAt.toISOString() })
}
