import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { saveNutritionistPlan } from "@/lib/nutrition/service"
import { prisma } from "@/lib/server/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Mismo control de cuota diaria que /api/ai/meal-photo (campos aiTokensUsed/aiTokenLimit en User).
async function checkAndUpdateQuota(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiTokensUsed: true, aiTokenLimit: true, lastAiTokenReset: true },
  })
  if (!user) return false

  const now = new Date()
  let currentUsage = user.aiTokensUsed
  if (!user.lastAiTokenReset || user.lastAiTokenReset.toDateString() !== now.toDateString()) {
    currentUsage = 0
    await prisma.user.update({ where: { id: userId }, data: { aiTokensUsed: 0, lastAiTokenReset: now } })
  }
  if (currentUsage >= user.aiTokenLimit) return false

  await prisma.user.update({ where: { id: userId }, data: { aiTokensUsed: { increment: 1 } } })
  return true
}

async function extractPlanFromPdf(buffer: Buffer): Promise<{ extractedText: string; needsReview: boolean }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  const filePart = {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: "application/pdf",
    },
  }
  const prompt =
    "Eres un asistente que extrae texto estructurado de un plan de nutricionista en PDF. " +
    "Devuelve el texto completo relevante (horarios de comidas, cantidades, equivalencias) tal cual aparece, sin resumir ni inventar datos."

  const result = await model.generateContent([filePart, prompt])
  const text = result.response.text()
  return { extractedText: text, needsReview: !text || text.trim().length < 20 }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const mealsJson = formData.get("mealsJson") as string | null
    const equivalencesJson = formData.get("equivalencesJson") as string | null

    if (!file && !mealsJson) {
      return NextResponse.json(
        { error: "Se requiere archivo o datos JSON" },
        { status: 400 }
      )
    }

    let extractedText = ""
    let pdfUrl = ""
    let needsReview = !mealsJson // Si no hay JSON estructurado, marcar para revisar

    if (file) {
      pdfUrl = `uploads/${file.name}` // Placeholder — en prod guardaría en S3/Blob

      const hasQuota = await checkAndUpdateQuota(user.id)
      if (!hasQuota) {
        return NextResponse.json(
          { error: "Límite diario de IA alcanzado, inténtalo mañana" },
          { status: 429 }
        )
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const extraction = await extractPlanFromPdf(buffer)
        extractedText = extraction.extractedText
        needsReview = needsReview || extraction.needsReview
      } catch (aiErr) {
        console.error("Error extrayendo PDF con Gemini:", aiErr)
        extractedText = `[PDF cargado: ${file.name}] — extracción automática falló, requiere revisión manual`
        needsReview = true
      }
    }

    const plan = await saveNutritionistPlan(user.id, {
      pdfOriginal: pdfUrl,
      extractedText,
      mealsJson: mealsJson ?? undefined,
      equivalencesJson: equivalencesJson ?? undefined,
      needsReview,
    })

    return NextResponse.json({ ok: true, plan }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error importando plan"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
