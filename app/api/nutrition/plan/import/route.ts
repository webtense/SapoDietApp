import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/server/api"
import { saveNutritionistPlan } from "@/lib/nutrition/service"

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

    // Si hay archivo, debería extraerse con Gemini (simulado aquí)
    if (file) {
      pdfUrl = `uploads/${file.name}` // Placeholder — en prod guardaría en S3/Blob
      // TODO: llamar a Gemini para extraer texto/JSON del PDF
      extractedText = `[PDF cargado: ${file.name}]`
    }

    const plan = await saveNutritionistPlan(user.id, {
      pdfOriginal: pdfUrl,
      extractedText,
      mealsJson,
      equivalencesJson,
      needsReview: !mealsJson, // Si no hay JSON, marcar para revisar
    })

    return NextResponse.json({ ok: true, plan }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error importando plan"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
