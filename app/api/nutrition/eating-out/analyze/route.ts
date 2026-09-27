import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/server/security"
import { prisma } from "@/lib/server/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { parseAllergies, parseForbiddenFoods } from "@/lib/nutrition/safety"
import { buildEatingOutPrompt, parseEatingOutResponse } from "@/lib/nutrition/eating-out"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function checkAndUpdateQuota(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiTokensUsed: true, aiTokenLimit: true, lastAiTokenReset: true },
  })

  if (!user) return false

  const now = new Date()
  const lastReset = user.lastAiTokenReset

  let currentUsage = user.aiTokensUsed
  if (!lastReset || lastReset.toDateString() !== now.toDateString()) {
    currentUsage = 0
    await prisma.user.update({
      where: { id: userId },
      data: { aiTokensUsed: 0, lastAiTokenReset: now },
    })
  }

  if (currentUsage >= user.aiTokenLimit) return false

  await prisma.user.update({
    where: { id: userId },
    data: { aiTokensUsed: { increment: 1 } },
  })

  return true
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No session" } }, { status: 401 })
    }

    const hasQuota = await checkAndUpdateQuota(user.id)
    if (!hasQuota) {
      return NextResponse.json({ error: { code: "AI_QUOTA_EXCEEDED", message: "Daily AI limit reached" } }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const mealType = (formData.get("mealType") as string) || "COMIDA"

    if (!file) {
      return NextResponse.json({ error: { code: "NO_FILE", message: "No image provided" } }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type || "image/jpeg",
      },
    }

    const prompt = buildEatingOutPrompt({
      dietType: profile?.dietType ?? null,
      forbiddenFoods: profile?.forbiddenFoods ?? null,
      allergies: parseAllergies(profile?.allergies),
    })

    let options: ReturnType<typeof parseEatingOutResponse> = []
    let message: string | null = null

    try {
      const result = await model.generateContent([imagePart, prompt])
      const responseText = result.response.text()
      options = parseEatingOutResponse(responseText)
      if (options.length === 0) {
        message = "No se pudo interpretar la carta con fiabilidad. Vuelve a intentarlo con una foto más nítida."
      }
    } catch (err) {
      console.error("Eating-out analyze error:", err)
      message = "El análisis de IA no está disponible ahora mismo. Inténtalo de nuevo en unos minutos."
    }

    const log = await prisma.eatingOutLog.create({
      data: {
        userId: user.id,
        mealType: mealType === "CENA" ? "CENA" : "COMIDA",
        selectedOption: null,
        notes: options.length > 0 ? JSON.stringify(options) : message,
      },
    })

    return NextResponse.json({
      ok: true,
      options,
      message,
      eatingOutLogId: log.id,
    })
  } catch (error) {
    console.error("Eating-out analyze error:", error)
    return NextResponse.json({ error: { code: "ANALYSIS_ERROR", message: "Failed to analyze menu" } }, { status: 500 })
  }
}
