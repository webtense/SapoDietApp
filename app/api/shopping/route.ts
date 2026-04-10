import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { shoppingListSchema } from "@/lib/validation"

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const latest = await prisma.shoppingList.findFirst({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ shoppingList: latest || null })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = shoppingListSchema.safeParse(body)
  if (!parsed.success) return apiError("Lista de compra inválida")

  const data = parsed.data
  const list = await prisma.shoppingList.create({
    data: {
      userId: user.id,
      supermarket: data.supermarket,
      totalEstimated: data.totalEstimated,
      items: {
        create: data.items.map((item) => ({
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          category: item.category,
          aisle: item.aisle,
          purchased: item.purchased,
          estimatedPrice: item.estimatedPrice,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json({ shoppingList: list })
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const itemId = typeof body?.itemId === "string" ? body.itemId : ""
  const purchased = typeof body?.purchased === "boolean" ? body.purchased : null
  if (!itemId || purchased === null) return apiError("Datos inválidos")

  const item = await prisma.shoppingItem.findUnique({ where: { id: itemId }, include: { shoppingList: true } })
  if (!item || item.shoppingList.userId !== user.id) return apiError("No encontrado", 404)

  const updated = await prisma.shoppingItem.update({
    where: { id: itemId },
    data: { purchased },
  })

  return NextResponse.json({ item: updated })
}
