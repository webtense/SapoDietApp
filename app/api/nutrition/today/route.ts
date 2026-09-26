import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { prisma } from "@/lib/server/prisma"
import { getActivePlan } from "@/lib/nutrition/service"
import { getReminderMoment } from "@/lib/server/reminders"

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

async function resolveMealWithOptions(recetasPorDia: Record<string, string> | undefined, todayName: string) {
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

  const alternatives = Object.entries(recetasPorDia)
    .filter(([day, id]) => day !== todayName && id && byId.has(id))
    .map(([day, id]) => ({ day, recipe: recipeSummary(byId.get(id)!) }))

  return {
    recommended: today ? recipeSummary(today) : null,
    alternatives,
  }
}

export async function GET() {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const plan = await getActivePlan(user.id)
  if (!plan || !plan.mealsJson) {
    return NextResponse.json({ ok: true, hasPlan: false })
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
    resolveMealWithOptions(comida?.recetasPorDia, todayName),
    resolveMealWithOptions(cena?.recetasPorDia, todayName),
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
