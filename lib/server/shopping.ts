import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { prisma } from "@/lib/server/prisma"
import { createSessionToken, hashToken, sanitizeText } from "@/lib/server/security-utils"

type ShoppingListWithItems = Awaited<ReturnType<typeof getOwnedShoppingList>>

function formatMoney(value?: number | null) {
  return typeof value === "number" ? `${value.toFixed(2)} EUR` : "-"
}

function buildRegionKey(postalCode?: string | null) {
  if (!postalCode) return null
  const clean = postalCode.replace(/\D/g, "").slice(0, 5)
  if (clean.length < 2) return null
  return clean.slice(0, 2)
}

export async function getOwnedShoppingList(userId: string, shoppingListId?: string) {
  const where = shoppingListId ? { id: shoppingListId, userId } : { userId }

  return prisma.shoppingList.findFirst({
    where,
    include: {
      items: { orderBy: [{ aisle: "asc" }, { name: "asc" }] },
      user: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              postalCode: true,
            },
          },
        },
      },
    },
    orderBy: shoppingListId ? undefined : { createdAt: "desc" },
  })
}

export async function createShoppingShare(userId: string, shoppingListId: string, toPhone: string) {
  const rawToken = createSessionToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.shoppingShare.create({
    data: {
      userId,
      shoppingListId,
      tokenHash,
      expiresAt,
      sharePhone: sanitizeText(toPhone, 30),
    },
  })

  return { rawToken, expiresAt }
}

export async function getSharedShoppingList(rawToken: string) {
  const tokenHash = hashToken(rawToken)

  return prisma.shoppingShare.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: {
      shoppingList: {
        include: {
          items: { orderBy: [{ aisle: "asc" }, { name: "asc" }] },
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: { postalCode: true } },
            },
          },
        },
      },
    },
  })
}

export async function updateSharedShoppingItemPrice(rawToken: string, itemId: string, actualPrice: number) {
  const share = await getSharedShoppingList(rawToken)
  if (!share) return null

  const item = share.shoppingList.items.find((entry) => entry.id === itemId)
  if (!item) return null

  const postalCode = share.shoppingList.user.profile?.postalCode ?? null
  const regionKey = buildRegionKey(postalCode)

  const updated = await prisma.shoppingItem.update({
    where: { id: itemId },
    data: { actualPrice },
  })

  await prisma.shoppingPriceObservation.create({
    data: {
      shoppingItemId: item.id,
      userId: share.userId,
      supermarket: share.shoppingList.supermarket,
      postalCode,
      regionKey,
      itemName: item.name.toLowerCase(),
      unit: item.unit,
      observedPrice: actualPrice,
      source: "shared-link",
    },
  })

  return updated
}

export async function buildShoppingPdf(list: NonNullable<ShoppingListWithItems>) {
  const pdf = await PDFDocument.create()
  let page = pdf.addPage([595.28, 841.89])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let y = 800
  const margin = 40
  const rowHeight = 18

  const write = (text: string, x: number, size = 11, isBold = false, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(text, { x, y, size, font: isBold ? bold : font, color })
  }

  const nextLine = (step = rowHeight) => {
    y -= step
    if (y < 60) {
      page = pdf.addPage([595.28, 841.89])
      y = 800
    }
  }

  write("SapoFit 3.3 - Lista de compra", margin, 18, true)
  nextLine(24)
  write(`Supermercado: ${list.supermarket}`, margin, 11, true)
  write(`Fecha: ${new Date(list.createdAt).toLocaleDateString("es-ES")}`, 340, 11)
  nextLine(22)
  write(`Estimado total: ${formatMoney(list.totalEstimated)}`, margin, 12, true)
  nextLine(26)

  let currentAisle = ""
  for (const item of list.items) {
    if (item.aisle !== currentAisle) {
      currentAisle = item.aisle
      write(currentAisle, margin, 12, true, rgb(0.07, 0.48, 0.32))
      nextLine(20)
    }

    const qty = `${Number(item.amount.toFixed(1))} ${item.unit}`
    const estimate = formatMoney(item.actualPrice ?? item.estimatedPrice)
    const purchased = item.purchased ? "[x]" : "[ ]"
    write(`${purchased} ${item.name}`, margin, 11)
    write(qty, 300, 11)
    write(estimate, 470, 11)
    nextLine()
  }

  nextLine(14)
  const actualTotal = list.items.reduce((sum, item) => sum + (item.actualPrice ?? item.estimatedPrice ?? 0), 0)
  write(`Total lista: ${formatMoney(actualTotal || list.totalEstimated)}`, margin, 13, true)

  return pdf.save()
}
