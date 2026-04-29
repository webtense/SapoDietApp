import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { buildShoppingPdf, getOwnedShoppingList } from "@/lib/server/shopping"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const listId = new URL(req.url).searchParams.get("listId") || undefined
  const list = await getOwnedShoppingList(user.id, listId)
  if (!list) return apiError("Lista no encontrada", 404)

  const pdfBytes = await buildShoppingPdf(list)

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sapofit-compra-${list.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
