import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { getActivePlan } from "@/lib/nutrition/service"
import { getReminderMoment } from "@/lib/server/reminders"
import { checkRecipeSafety, parseAllergies, parseForbiddenFoods, type SafetyContext } from "@/lib/nutrition/safety"

const WEEKDAY_NAMES = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"] as const

function recipeSummary(recipe: {
  id: string
  name: string
  description: string | null
  preparationTime: number | null
  servings: number
  method: string
  instructions: string | null
  allergens: string | null
  ingredients: { ingredient: string; rawWeight: number | null; drainedWeight: number | null }[]
}) {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    preparationTime: recipe.preparationTime,
    servings: recipe.servings,
    method: recipe.method,
    steps: recipe.instructions ? (JSON.parse(recipe.instructions) as string[]) : [],
    allergens: recipe.allergens ? (JSON.parse(recipe.allergens) as string[]) : [],
    ingredients: recipe.ingredients.map((i) => ({
      name: i.ingredient,
      weight: i.rawWeight ?? i.drainedWeight ?? null,
    })),
  }
}

function isRecipeSafe(
  recipe: { name: string; allergens: string | null; ingredients: { ingredient: string }[] },
  ctx: SafetyContext
) {
  const violations = checkRecipeSafety(recipe, ctx)
  return !violations.some((v) => v.severity === "block")
}

async function resolveMealWithOptions(
  recetasPorDia: Record<string, string> | undefined,
  todayName: string,
  safetyCtx: SafetyContext
) {
  if (!recetasPorDia) return null

  const ids = Object.values(recetasPorDia).filter(Boolean)
  if (ids.length === 0) return null

  const recipes = await prisma.recipe.findMany({
    where: { id: { in: ids } },
    include: { ingredients: true },
  })
  const byId = new Map(recipes.map((r) => [r.id, r]))

  const todayId = recetasPorDia[todayName]
  const today = todayId ? byId.get(todayId) : undefined

  const otherEntries = Object.entries(recetasPorDia).filter(([day, id]) => day !== todayName && id && byId.has(id))

  let recommended = today ?? null
  let blockedBySafety = false

  if (recommended && !isRecipeSafe(recommended, safetyCtx)) {
    blockedBySafety = true
    // Buscar la primera alternativa de la semana que sí pase el check de seguridad.
    const fallback = otherEntries.find(([, id]) => isRecipeSafe(byId.get(id)!, safetyCtx))
    recommended = fallback ? byId.get(fallback[1])! : null
  }

  const alternatives = otherEntries
    .filter(([, id]) => id !== recommended?.id)
    .map(([day, id]) => ({ day, recipe: recipeSummary(byId.get(id)!) }))

  return {
    recommended: recommended ? recipeSummary(recommended) : null,
    alternatives,
    blockedBySafety,
  }
}

export async function GET() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const plan = await getActivePlan(user.id)
  if (!plan || !plan.mealsJson) {
    return NextResponse.json({ ok: true, hasPlan: false })
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  const safetyCtx: SafetyContext = {
    allergies: parseAllergies(profile?.allergies),
    forbiddenFoods: parseForbiddenFoods(profile?.forbiddenFoods),
    dietType: profile?.dietType ?? null,
  }

  let meals: Record<string, unknown>
  try {
    meals = JSON.parse(plan.mealsJson)
  } catch {
    return NextResponse.json({ ok: true, hasPlan: false })
  }

  // Compatibilidad: el plan de Zoraida anida todo bajo estructuraDiaria,
  // el plan genérico "alta en proteínas" lo tiene en la raíz.
  const root = (meals.estructuraDiaria as Record<string, unknown>) ?? meals

  const moment = getReminderMoment(new Date(), user.timezone)
  const todayName = WEEKDAY_NAMES[Number(moment.day)]

  const desayuno = root.desayuno as { horario?: string; descripcion?: string } | undefined
  const mediaManana = root.mediaManana as
    | { horario?: string; descripcion?: string; opcionesProteina?: string[]; rotacion?: Record<string, string>; notas?: string }
    | undefined
  const merienda = root.merienda as { horario?: string; descripcion?: string; opciones?: string[]; notas?: string } | undefined
  const comida = root.comida as { horario?: string; descripcion?: string; recetasPorDia?: Record<string, string> } | undefined
  const cena = root.cena as { horario?: string; descripcion?: string; recetasPorDia?: Record<string, string> } | undefined

  const [comidaResuelta, cenaResuelta] = await Promise.all([
    resolveMealWithOptions(comida?.recetasPorDia, todayName, safetyCtx),
    resolveMealWithOptions(cena?.recetasPorDia, todayName, safetyCtx),
  ])

  return NextResponse.json({
    ok: true,
    hasPlan: true,
    needsReview: plan.needsReview,
    today: todayName,
    desayuno: desayuno
      ? { horario: desayuno.horario, descripcion: desayuno.descripcion }
      : null,
    mediaManana: mediaManana
      ? {
          horario: mediaManana.horario,
          descripcion: mediaManana.descripcion,
          hoy: mediaManana.rotacion?.[todayName] ?? null,
          opciones: mediaManana.opcionesProteina ?? (mediaManana.rotacion ? Array.from(new Set(Object.values(mediaManana.rotacion))) : []),
          notas: mediaManana.notas,
        }
      : null,
    comida: comida
      ? { horario: comida.horario, descripcion: comida.descripcion, ...comidaResuelta }
      : null,
    merienda: merienda
      ? { horario: merienda.horario, descripcion: merienda.descripcion, opciones: merienda.opciones ?? [], notas: merienda.notas }
      : null,
    cena: cena ? { horario: cena.horario, descripcion: cena.descripcion, ...cenaResuelta } : null,
  })
}
