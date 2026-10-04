import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAdmin } from "@/lib/server/api"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { generateNewsletterToken, sendNewsletterConfirmationEmail } from "@/lib/server/newsletter"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Parser CSV minimalista: soporta comillas dobles y comas dentro de campos. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0))
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const rate = await checkRateLimit(`newsletter:import:${user.id}`, 1, 60 * 60 * 1000)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Ya se importó un CSV en la última hora" }, { status: 429 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get("file")

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo CSV" }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCsv(text)

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV vacío" }, { status: 400 })
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const emailIdx = header.indexOf("email")

  if (emailIdx === -1) {
    return NextResponse.json({ error: "El CSV debe tener una columna 'email'" }, { status: 400 })
  }

  const dataRows = rows.slice(1)

  const seen = new Set<string>()
  const invalid: string[] = []
  const duplicatesInFile: string[] = []
  const candidateEmails: string[] = []

  for (const r of dataRows) {
    const raw = (r[emailIdx] ?? "").trim().toLowerCase()
    if (!raw) continue

    if (!EMAIL_RE.test(raw)) {
      invalid.push(raw)
      continue
    }

    if (seen.has(raw)) {
      duplicatesInFile.push(raw)
      continue
    }

    seen.add(raw)
    candidateEmails.push(raw)
  }

  const existing = await prisma.newsletterSubscriber.findMany({
    where: { email: { in: candidateEmails } },
    select: { email: true, status: true },
  })
  const existingMap = new Map(existing.map((e) => [e.email, e.status]))

  const toCreate: string[] = []
  const skippedUnsubscribed: string[] = []
  const skippedExisting: string[] = []

  for (const email of candidateEmails) {
    const status = existingMap.get(email)
    if (status === "UNSUBSCRIBED") {
      skippedUnsubscribed.push(email)
    } else if (status === "PENDING" || status === "CONFIRMED") {
      skippedExisting.push(email)
    } else {
      toCreate.push(email)
    }
  }

  let imported = 0
  for (const email of toCreate) {
    const token = generateNewsletterToken()
    const subscriber = await prisma.newsletterSubscriber.create({
      data: { email, token, source: "import", consentAt: new Date() },
    })
    await prisma.newsletterAuditLog.create({
      data: { subscriberId: subscriber.id, action: "SUBSCRIBED", metadata: { source: "import", importedBy: user.id } },
    })
    await sendNewsletterConfirmationEmail(email, token)
    imported += 1
  }

  const skipped = skippedUnsubscribed.length + skippedExisting.length + duplicatesInFile.length

  return NextResponse.json({
    imported,
    skipped,
    invalid: invalid.length,
    details: {
      skippedUnsubscribed,
      skippedExisting,
      duplicatesInFile,
      invalidEmails: invalid,
    },
  })
}
