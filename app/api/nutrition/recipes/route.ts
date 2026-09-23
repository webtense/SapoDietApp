import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { createRecipe } from "@/lib/nutrition/service"
import { z } from "zod"

const recipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  mealType: z.enum(["DESAYUNO", "MEDIA_MAÑANA", "COMIDA", "MERIENDA", "CENA"]),
  servings: z.number().int().min(1).optional(),
  preparationTime: z.number().int().optional(),
  cookingTime: z.number().int().optional(),
  difficulty: z.enum(["FACIL", "NORMAL", "DIFICIL"]).optional(),
  method: z.enum(["PLANCHA", "HORNO", "CAZUELA", "FREIDORA_AIRE", "COCIDO"]).optional(),
  canFreeze: z.boolean().optional(),
  nutritionPerServing: z.string().optional(),
  allergens: z.string().optional(),
  ingredients: z.array(
    z.object({
      ingredient: z.string(),
      rawWeight: z.number().optional(),
      cookedWeight: z.number().optional(),
      drainedWeight: z.number().optional(),
      frozenWeight: z.number().optional(),
      substitutionGroup: z.string().optional(),
    })
  ),
})

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const body = await req.json().catch(() => null)
  const parsed = recipeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recipe data" }, { status: 400 })
  }

  try {
    const recipe = await createRecipe(parsed.data)
    return NextResponse.json({ ok: true, recipe }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error creating recipe"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error || !user) return error

  const { searchParams } = new URL(req.url)
  const mealType = searchParams.get("mealType")

  try {
    const recipes = await (async () => {
      const { prisma } = await import("@/lib/server/prisma")
      return prisma.recipe.findMany({
        where: mealType ? { mealType } : undefined,
        include: {
          ingredients: true,
          variants: true,
        },
        orderBy: { name: "asc" },
      })
    })()

    return NextResponse.json({ ok: true, recipes })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error loading recipes"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
