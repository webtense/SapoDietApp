import { NextRequest, NextResponse } from "next/server"
import { apiError, requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { Meal, MealPlan } from "@/lib/diet-calculator"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

const MEAL_LABEL: Record<string, string> = {
  desayuno: "desayuno",
  mediaManana: "media mañana / snack",
  almuerzo: "comida",
  merienda: "merienda",
  cena: "cena",
}

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

function fallbackAlternatives(mealType: string, target: Meal | null): Meal[] {
  const base = target ?? { calorias: 400, proteinas: 20, carbohidratos: 40, grasas: 15 }
  const names: Record<string, string[]> = {
    desayuno: ["Tostada de aguacate y huevo", "Yogur griego con fruta y frutos secos", "Tortitas de plátano y proteína"],
    mediaManana: ["Fruta con un puñado de almendras", "Yogur natural con canela", "Tosta de pavo y tomate"],
    almuerzo: ["Pechuga de pollo con arroz y verduras", "Salmón con quinoa y brócoli", "Lentejas estofadas con verduras"],
    merienda: ["Batido de proteína con plátano", "Queso fresco con frutos rojos", "Hummus con crudités"],
    cena: ["Merluza a la plancha con ensalada", "Tortilla francesa con espinacas", "Pechuga de pavo con verduras al vapor"],
  }
  return (names[mealType] ?? names.almuerzo).map((nombre) => ({
    nombre,
    ingredientes: [],
    instrucciones: ["Alternativa genérica: no se pudo generar el detalle con IA en este momento."],
    calorias: Math.round(base.calorias),
    proteinas: Math.round(base.proteinas),
    carbohidratos: Math.round(base.carbohidratos),
    grasas: Math.round(base.grasas),
    tiempoPreparacion: 15,
  }))
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const mealType = body?.mealType as string | undefined
  if (!mealType || !MEAL_LABEL[mealType]) {
    return apiError("mealType inválido", 400)
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  const currentPlan = await prisma.mealPlan.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })

  let currentMeal: Meal | null = null
  if (currentPlan) {
    try {
      const parsed = JSON.parse(currentPlan.planJson) as { mealPlan: MealPlan }
      currentMeal = parsed.mealPlan?.[mealType as keyof MealPlan] ?? null
    } catch {
      currentMeal = null
    }
  }

  const hasQuota = await checkAndUpdateQuota(user.id)
  if (!hasQuota || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ ok: true, alternatives: fallbackAlternatives(mealType, currentMeal), fromAi: false })
  }

  const forbidden = (profile?.forbiddenFoods || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const allergies: string[] = profile?.allergies ? JSON.parse(profile.allergies) : []
  const target = currentMeal ?? { calorias: 400, proteinas: 20, carbohidratos: 40, grasas: 15 }

  const prompt = `Eres un nutricionista. Propón 3 alternativas de ${MEAL_LABEL[mealType]} distintas entre sí, cada una con
aproximadamente ${Math.round(target.calorias)} kcal, ${Math.round(target.proteinas)}g de proteína,
${Math.round(target.carbohidratos)}g de carbohidratos y ${Math.round(target.grasas)}g de grasa.
Tipo de dieta del usuario: ${profile?.dietType || "sin preferencia"}.
${forbidden.length ? `Alimentos a evitar: ${forbidden.join(", ")}.` : ""}
${allergies.length ? `Alergias/intolerancias: ${allergies.join(", ")}.` : ""}

Responde SOLO con un array JSON de 3 objetos, cada uno con este formato exacto:
{"nombre": "string", "ingredientes": [{"nombre": "string", "cantidad": número, "unidad": "g|ml|unidad", "calorias": número, "proteinas": número, "carbohidratos": número, "grasas": número}], "instrucciones": ["paso 1", "paso 2"], "calorias": número, "proteinas": número, "carbohidratos": número, "grasas": número, "tiempoPreparacion": número}`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("No JSON array found")
    const alternatives = JSON.parse(match[0]) as Meal[]
    if (!Array.isArray(alternatives) || alternatives.length === 0) throw new Error("Empty alternatives")
    return NextResponse.json({ ok: true, alternatives, fromAi: true })
  } catch {
    return NextResponse.json({ ok: true, alternatives: fallbackAlternatives(mealType, currentMeal), fromAi: false })
  }
}
