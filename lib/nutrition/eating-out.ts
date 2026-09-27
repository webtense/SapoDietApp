// Lógica pura de "modo restaurante con IA": construir el prompt de análisis
// de carta y parsear la respuesta de Gemini. Sin llamadas de red aquí (eso
// vive en el endpoint); testeable de forma aislada.

export interface RestaurantOption {
  plato: string
  razon: string
  calorias_estimadas: number
  proteina_estimada_g: number
}

export interface EatingOutProfileContext {
  dietType: string | null
  forbiddenFoods: string | null
  allergies: string[]
}

export function buildEatingOutPrompt(ctx: EatingOutProfileContext): string {
  const restricciones: string[] = []
  if (ctx.dietType) restricciones.push(`Tipo de dieta: ${ctx.dietType}`)
  if (ctx.forbiddenFoods) restricciones.push(`Alimentos que no le gustan o evita: ${ctx.forbiddenFoods}`)
  if (ctx.allergies.length > 0) restricciones.push(`ALERGIAS (excluir siempre platos con estos ingredientes): ${ctx.allergies.join(", ")}`)

  const contextoTexto = restricciones.length > 0
    ? restricciones.join("\n")
    : "Sin restricciones dietéticas conocidas."

  return `Eres un nutricionista experto. Analiza esta foto de una carta o menú de restaurante.

Contexto del comensal:
${contextoTexto}

Identifica los platos legibles del menú y propone las 3 mejores opciones para este comensal, rankeadas de mejor a peor según su dieta y restricciones. Nunca propongas un plato que contenga un ingrediente de sus alergias.

Responde SOLO con un array JSON de 3 objetos:
[{"plato": "string", "razon": "string breve", "calorias_estimadas": número, "proteina_estimada_g": número}]`
}

export function parseEatingOutResponse(responseText: string): RestaurantOption[] {
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is RestaurantOption =>
          item && typeof item.plato === "string" && typeof item.razon === "string"
      )
      .map((item) => ({
        plato: item.plato,
        razon: item.razon,
        calorias_estimadas: typeof item.calorias_estimadas === "number" ? item.calorias_estimadas : 0,
        proteina_estimada_g: typeof item.proteina_estimada_g === "number" ? item.proteina_estimada_g : 0,
      }))
  } catch {
    return []
  }
}
