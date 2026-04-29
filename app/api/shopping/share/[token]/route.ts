import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/server/api"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { buildShoppingPdf, getSharedShoppingList, updateSharedShoppingItemPrice } from "@/lib/server/shopping"
import { shoppingSharePriceUpdateSchema } from "@/lib/validation"

export async function GET(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  const share = await getSharedShoppingList(token)
  if (!share) return apiError("Enlace no válido o caducado", 404)

  const format = new URL(req.url).searchParams.get("format")
  if (format === "pdf") {
    const pdfBytes = await buildShoppingPdf(share.shoppingList)
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="sapofit-compra-${share.shoppingList.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  }

  return NextResponse.json({
    shoppingList: {
      id: share.shoppingList.id,
      supermarket: share.shoppingList.supermarket,
      totalEstimated: share.shoppingList.totalEstimated,
      createdAt: share.shoppingList.createdAt,
      ownerName: share.shoppingList.user.name,
      expiresAt: share.expiresAt,
      items: share.shoppingList.items,
    },
  })
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  const body = await req.json().catch(() => null)
  const parsed = shoppingSharePriceUpdateSchema.safeParse(body)
  if (!parsed.success) return apiError("Precio inválido")

  const rate = await checkRateLimit(`shopping-share-edit:${token}`, 30, 86_400_000)
  if (!rate.allowed) return apiError("Demasiadas actualizaciones para este enlace", 429)

  const updated = await updateSharedShoppingItemPrice(token, parsed.data.itemId, parsed.data.actualPrice)
  if (!updated) return apiError("Enlace o producto no válido", 404)

  return NextResponse.json({ ok: true, item: updated })
}
