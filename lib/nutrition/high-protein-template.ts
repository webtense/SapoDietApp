import { prisma } from "@/lib/server/prisma"
import { saveNutritionistPlan } from "@/lib/nutrition/service"

// Menú semanal "alta en proteínas" (14 recetas para 4 personas, lunes-domingo)
// aportado por el usuario. Se asigna automáticamente al primer usuario que
// elige dietType "alta en proteínas" y aún no tiene su propio plan de
// nutricionista; a partir de ahí es su copia, personalizable sin afectar a
// nadie más (NutritionistPlan.userId es @unique).
export const HIGH_PROTEIN_RECIPES: {
  weekday: string
  mealType: string
  name: string
  description: string
  servings: number
  preparationTime: number
  method: string
  allergens: string[]
  steps: string[]
  ingredients: { name: string; weight: number; unit: string }[]
}[] = [
  { weekday: 'LUNES', mealType: 'COMIDA', name: 'Estofado especiado de pollo, patata y verduras', description: 'Lunes — Pimentón, laurel, ajo, pimienta y caldo casero desgrasado al gusto.', servings: 4, preparationTime: 40, method: 'COCIDO', allergens: [], steps: ["Dorar el pollo con 12 g de aceite y retirarlo.", "Pochar cebolla y pimiento con otros 12 g. Añadir tomate rallado, ajo, pimentón y laurel.", "Incorporar la patata chascada y cubrir justo con caldo. Cocer 18 minutos.", "Añadir pollo y calabacín, cocer 8 minutos más y dejar reposar. Servir con los canónigos aliñados con el aceite restante."], ingredients: [{"name": "Pechuga de pollo en dados", "weight": 600, "unit": "g"}, {"name": "Patata", "weight": 760, "unit": "g"}, {"name": "Calabacín", "weight": 500, "unit": "g"}, {"name": "Pimiento rojo", "weight": 300, "unit": "g"}, {"name": "Cebolla", "weight": 200, "unit": "g"}, {"name": "Tomate", "weight": 400, "unit": "g"}, {"name": "Canónigos", "weight": 100, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'LUNES', mealType: 'CENA', name: 'Pastel caliente de merluza y calabacín con espárragos', description: 'Lunes — Ajo, perejil, limón, sal y pimienta al gusto.', servings: 4, preparationTime: 30, method: 'HORNO', allergens: [], steps: ["Rallar el calabacín, salar ligeramente, reposar y escurrir bien.", "Desmenuzar la merluza cruda y mezclarla con calabacín, ajo, perejil y pimienta.", "Formar cuatro pasteles gruesos, pincelar con parte del aceite y hornear 16 minutos a 190°C.", "Saltear los espárragos con el aceite restante y servir con limón."], ingredients: [{"name": "Merluza", "weight": 980, "unit": "g"}, {"name": "Calabacín", "weight": 500, "unit": "g"}, {"name": "Espárragos verdes", "weight": 400, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'MARTES', mealType: 'COMIDA', name: 'Arroz meloso de lomo, berenjena y champiñones', description: 'Martes — Ajo, pimentón, tomillo y caldo casero desgrasado al gusto.', servings: 4, preparationTime: 35, method: 'COCIDO', allergens: [], steps: ["Dorar el lomo con 12 g de aceite y retirarlo.", "Cocinar berenjena y champiñones con el resto del aceite hasta que estén tiernos. Añadir ajo y pimentón.", "Incorporar el arroz, rehogar un minuto y añadir caldo caliente poco a poco.", "A los 14 minutos, devolver el lomo y cocinar hasta que el arroz quede meloso. Reposar 3 minutos."], ingredients: [{"name": "Lomo de cerdo en tiras", "weight": 580, "unit": "g"}, {"name": "Arroz", "weight": 160, "unit": "g"}, {"name": "Berenjena", "weight": 600, "unit": "g"}, {"name": "Champiñones", "weight": 400, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'MARTES', mealType: 'CENA', name: 'Rollos de tortilla rellenos con ensalada picada', description: 'Martes — Vinagre, orégano, pimienta y sal al gusto.', servings: 4, preparationTime: 25, method: 'PLANCHA', allergens: ['huevo'], steps: ["Batir dos huevos por persona y cuajar cuatro tortillas muy finas.", "Picar tomate, pepino y canónigos. Aliñar con vinagre, orégano y 20 g de aceite.", "Rellenar cada tortilla con parte de la ensalada y enrollar.", "Cortar los rollos en dos y servir con el resto de la ensalada y el aceite asignado."], ingredients: [{"name": "Huevo", "weight": 8, "unit": "unidad"}, {"name": "Tomate", "weight": 500, "unit": "g"}, {"name": "Pepino", "weight": 400, "unit": "g"}, {"name": "Canónigos", "weight": 120, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'MIERCOLES', mealType: 'COMIDA', name: 'Curry ligero de lentejas y pavo con verduras', description: 'Miercoles — Curry, comino, ajo y caldo casero desgrasado al gusto.', servings: 4, preparationTime: 35, method: 'COCIDO', allergens: [], steps: ["Dorar el pavo con 12 g de aceite y reservar.", "Pochar cebolla y zanahoria con el aceite restante. Añadir curry, comino y ajo.", "Agregar calabacín, un vaso de caldo y las lentejas. Cocer 10 minutos.", "Incorporar pavo y espinacas, cocinar 5 minutos y reducir hasta obtener una salsa ligada, sin nata ni leche de coco."], ingredients: [{"name": "Lentejas cocidas escurridas", "weight": 760, "unit": "g"}, {"name": "Pechuga de pavo en dados", "weight": 880, "unit": "g"}, {"name": "Espinacas", "weight": 400, "unit": "g"}, {"name": "Zanahoria", "weight": 300, "unit": "g"}, {"name": "Calabacín", "weight": 400, "unit": "g"}, {"name": "Cebolla", "weight": 200, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'MIERCOLES', mealType: 'CENA', name: 'Wok de sepia con judías verdes y champiñones', description: 'Miercoles — Ajo, perejil, limón, pimienta y sal al gusto. 275 g de sepia por persona (ver Ajustes).', servings: 4, preparationTime: 25, method: 'PLANCHA', allergens: ['crustaceos_moluscos'], steps: ["Hervir o cocinar al vapor las judías 6 minutos y escurrir.", "Secar la sepia y saltearla por tandas a fuego muy fuerte para evitar que cueza. Reservar.", "Saltear champiñones y judías con el aceite. Añadir ajo y pimienta.", "Devolver la sepia, mezclar un minuto y terminar con perejil y limón."], ingredients: [{"name": "Sepia limpia", "weight": 1100, "unit": "g"}, {"name": "Judías verdes", "weight": 600, "unit": "g"}, {"name": "Champiñones", "weight": 400, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'JUEVES', mealType: 'COMIDA', name: 'Bandeja de salmón con boniato y verduras al pimentón', description: 'Jueves — Pimentón, ajo, limón, pimienta y sal al gusto.', servings: 4, preparationTime: 35, method: 'HORNO', allergens: [], steps: ["Cortar el boniato en dados pequeños, mezclarlo con cebolla, pimentón y 18 g de aceite. Hornear 15 minutos a 200°C.", "Añadir calabacín y espárragos, mezclar y hornear 8 minutos.", "Colocar el salmón encima, condimentar con ajo, pimienta y limón.", "Hornear 10 a 12 minutos más, hasta que el centro quede jugoso."], ingredients: [{"name": "Salmón", "weight": 500, "unit": "g"}, {"name": "Boniato", "weight": 540, "unit": "g"}, {"name": "Calabacín", "weight": 400, "unit": "g"}, {"name": "Espárragos verdes", "weight": 400, "unit": "g"}, {"name": "Cebolla", "weight": 200, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'JUEVES', mealType: 'CENA', name: 'Albóndigas de pollo en crema de calabacín y puerro', description: 'Jueves — Ajo, perejil, nuez moscada, pimienta y caldo casero al gusto.', servings: 4, preparationTime: 40, method: 'PLANCHA', allergens: [], steps: ["Mezclar el pollo picado con ajo, perejil y pimienta. Formar albóndigas sin pan ni harina.", "Dorarlas con 12 g de aceite y reservar.", "Pochar puerro y calabacín con el aceite restante, añadir caldo y cocer 12 minutos. Triturar.", "Introducir las albóndigas en la crema y cocinar tapadas 8 minutos. Ajustar con nuez moscada."], ingredients: [{"name": "Pechuga de pollo picada", "weight": 600, "unit": "g"}, {"name": "Calabacín", "weight": 700, "unit": "g"}, {"name": "Puerro", "weight": 400, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'VIERNES', mealType: 'COMIDA', name: 'Pastel de carne y patata con ensalada crujiente', description: 'Viernes — Cebolla o ajo, pimienta, pimentón y nuez moscada al gusto.', servings: 4, preparationTime: 45, method: 'HORNO', allergens: [], steps: ["Cocer la patata y chafarla con agua de cocción, nuez moscada y 12 g de aceite.", "Saltear la ternera con ajo, pimentón y 12 g de aceite hasta que quede suelta.", "Montar en una fuente una capa de carne y otra de patata. Gratinar sin queso durante 8 minutos.", "Servir con cogollos, tomate y pepino aliñados con el aceite restante y vinagre."], ingredients: [{"name": "Ternera magra picada", "weight": 800, "unit": "g"}, {"name": "Patata", "weight": 760, "unit": "g"}, {"name": "Tomate", "weight": 500, "unit": "g"}, {"name": "Pepino", "weight": 400, "unit": "g"}, {"name": "Cogollos", "weight": 4, "unit": "unidad"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'VIERNES', mealType: 'CENA', name: 'Tomates rellenos de crema de atún y pepino', description: 'Viernes — Vinagre, orégano, pimienta y sal al gusto. 150 g de atún escurrido por persona (ver Ajustes).', servings: 4, preparationTime: 20, method: 'COCIDO', allergens: [], steps: ["Vaciar los tomates y picar la pulpa.", "Picar muy fino la mitad del pepino y mezclarlo con atún, pulpa de tomate, vinagre, orégano y 20 g de aceite.", "Rellenar los tomates y enfriar 10 minutos.", "Servir sobre canónigos con el resto del pepino y el aceite. Opcional: trasladar aquí los 25 g de queso semicurado de la merienda."], ingredients: [{"name": "Atún al natural escurrido", "weight": 600, "unit": "g"}, {"name": "Tomate grande", "weight": 600, "unit": "g"}, {"name": "Pepino", "weight": 500, "unit": "g"}, {"name": "Canónigos", "weight": 150, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'SABADO', mealType: 'COMIDA', name: 'Fideuá ligera de gambas y verduras', description: 'Sabado — Ajo, pimentón, perejil y caldo casero al gusto.', servings: 4, preparationTime: 35, method: 'PLANCHA', allergens: ['crustaceos_moluscos'], steps: ["Saltear las gambas por tandas con 12 g de aceite y reservar.", "Dorar champiñones, calabacín y espárragos con el aceite restante. Añadir ajo y pimentón.", "Incorporar la pasta, rehogar y añadir la cantidad justa de caldo caliente.", "Cocer según el envase. Añadir las gambas en los dos últimos minutos y terminar con perejil."], ingredients: [{"name": "Gambas limpias", "weight": 1460, "unit": "g"}, {"name": "Pasta corta o fideo", "weight": 160, "unit": "g"}, {"name": "Calabacín", "weight": 400, "unit": "g"}, {"name": "Espárragos", "weight": 400, "unit": "g"}, {"name": "Champiñones", "weight": 400, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'SABADO', mealType: 'CENA', name: 'Tortilla al horno de espinacas, champiñones y cebolla', description: 'Sabado — Pimienta, ajo y sal al gusto.', servings: 4, preparationTime: 30, method: 'HORNO', allergens: ['huevo'], steps: ["Pochar la cebolla a fuego lento con 20 g de aceite.", "Añadir champiñones y, cuando pierdan el agua, incorporar las espinacas.", "Batir los huevos y mezclar con las verduras. Verter en una fuente pincelada con el aceite restante.", "Hornear 12 a 15 minutos a 185°C, hasta que esté cuajada pero jugosa."], ingredients: [{"name": "Huevo", "weight": 8, "unit": "unidad"}, {"name": "Espinacas", "weight": 400, "unit": "g"}, {"name": "Champiñones", "weight": 300, "unit": "g"}, {"name": "Cebolla", "weight": 250, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] },
  { weekday: 'DOMINGO', mealType: 'COMIDA', name: 'Arroz caldoso mediterráneo de merluza', description: 'Domingo — Ajo, pimentón, laurel y caldo de pescado casero al gusto. Los 20 g de aceite sustituyen parte de los 36 g porque se añaden aceitunas.', servings: 4, preparationTime: 35, method: 'COCIDO', allergens: [], steps: ["Pochar cebolla con el aceite. Añadir ajo, tomate rallado y pimentón y reducir bien.", "Incorporar calabacín, arroz y laurel. Añadir caldo caliente para que quede caldoso.", "A los 13 minutos, agregar la merluza en trozos y las aceitunas.", "Cocinar 5 minutos, apagar y reposar 3 minutos."], ingredients: [{"name": "Merluza", "weight": 980, "unit": "g"}, {"name": "Arroz", "weight": 160, "unit": "g"}, {"name": "Tomate", "weight": 600, "unit": "g"}, {"name": "Calabacín", "weight": 400, "unit": "g"}, {"name": "Cebolla", "weight": 250, "unit": "g"}, {"name": "Aceitunas", "weight": 80, "unit": "g"}, {"name": "Aceite de oliva", "weight": 20, "unit": "g"}] },
  { weekday: 'DOMINGO', mealType: 'CENA', name: 'Falsa lasaña de calabacín, pavo y crema de zanahoria', description: 'Domingo — Ajo, pimienta, tomillo y nuez moscada al gusto.', servings: 4, preparationTime: 45, method: 'HORNO', allergens: [], steps: ["Cortar el calabacín en láminas y hornearlo 10 minutos para quitar humedad.", "Cocer la zanahoria y triturarla con parte del agua, nuez moscada y 12 g de aceite.", "Dorar el pavo con ajo, tomillo, pimienta y 12 g de aceite.", "Montar capas de calabacín, pavo y crema de zanahoria. Pincelar con el aceite restante y hornear 15 minutos."], ingredients: [{"name": "Pechuga de pavo picada", "weight": 880, "unit": "g"}, {"name": "Calabacín", "weight": 800, "unit": "g"}, {"name": "Zanahoria", "weight": 500, "unit": "g"}, {"name": "Aceite de oliva", "weight": 36, "unit": "g"}] }
]

export function isHighProteinDiet(dietType: string | null | undefined) {
  if (!dietType) return false
  const normalized = dietType
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  return normalized.includes("proteina")
}

async function ensureHighProteinRecipes() {
  const existing = await prisma.recipe.findMany({
    where: { name: { in: HIGH_PROTEIN_RECIPES.map((r) => r.name) } },
  })
  const byName = new Map(existing.map((r) => [r.name, r]))

  const recipeIdByKey: Record<string, string> = {}

  for (const r of HIGH_PROTEIN_RECIPES) {
    const key = `${r.weekday}_${r.mealType}`
    let recipe = byName.get(r.name)
    if (!recipe) {
      recipe = await prisma.recipe.create({
        data: {
          name: r.name,
          description: r.description,
          mealType: r.mealType,
          servings: r.servings,
          preparationTime: r.preparationTime,
          method: r.method,
          allergens: r.allergens.length ? JSON.stringify(r.allergens) : null,
          instructions: JSON.stringify(r.steps),
          ingredients: {
            create: r.ingredients.map((ing) =>
              ing.unit === "unidad"
                ? { ingredient: `${ing.name} (${ing.weight} uds)` }
                : { ingredient: ing.name, rawWeight: ing.weight }
            ),
          },
        },
      })
      byName.set(r.name, recipe)
    }
    recipeIdByKey[key] = recipe.id
  }

  return recipeIdByKey
}

export async function assignHighProteinPlanIfNeeded(userId: string) {
  const alreadyHasPlan = await prisma.nutritionistPlan.findUnique({ where: { userId } })
  if (alreadyHasPlan) return null

  const ids = await ensureHighProteinRecipes()

  const mealsJson = {"tipo": "alta_en_proteinas", "fuente": "Menú semanal elaborado y lista de compra (recetas para 4 personas, adaptadas de las equivalencias de un plan de nutricionista)", "desayuno": {"descripcion": "Café con leche semidesnatada o americano, 10 g de crema de cacahuete y una elección: scoop de proteína o 40 g de pan/cracker de espelta (no ambos)."}, "mediaManana": {"descripcion": "40 g de pan, 2 g de aceite y una rotación de fiambre magro por día.", "rotacion": {"LUNES": "30 g jamón serrano", "MARTES": "90 g jamón cocido", "MIERCOLES": "55 g lomo embuchado", "JUEVES": "65 g pavo loncheado", "VIERNES": "30 g jamón serrano", "SABADO": "90 g jamón cocido", "DOMINGO": "55 g lomo embuchado"}, "notas": "La lista de la compra del documento original indica 90 g de jamón serrano en total semanal, que no coincide exactamente con la suma de la rotación indicada aquí (60 g); se deja tal cual el documento original, sin corregir, pendiente de aclarar con la nutricionista."}, "comida": {"recetasPorDia": {"LUNES": "recipe_altaprot_93e92a15d3e94a79b66d", "MARTES": "recipe_altaprot_61f0999d9e2c42799865", "MIERCOLES": "recipe_altaprot_125e81a59bea4453981b", "JUEVES": "recipe_altaprot_85414f11b9bd4260931d", "VIERNES": "recipe_altaprot_fd53d49cbcfa4fabb3db", "SABADO": "recipe_altaprot_378d1c480c534a4eb8e7", "DOMINGO": "recipe_altaprot_46e22f9271724a868ca7"}}, "merienda": {"descripcion": "125 g de yogur casero desnatado + una opción equivalente del plan (queso semicurado, embutido magro...).", "notas": "El documento no detalla una rotación día a día completa para la merienda más allá del yogur base; pendiente de concretar con la nutricionista."}, "cena": {"recetasPorDia": {"LUNES": "recipe_altaprot_3915f56bd59743ec858e", "MARTES": "recipe_altaprot_371cf22586024985b1d2", "MIERCOLES": "recipe_altaprot_0bbccca535064bf1957b", "JUEVES": "recipe_altaprot_943049684e0e43508452", "VIERNES": "recipe_altaprot_0a8a5c33440c47d281db", "SABADO": "recipe_altaprot_8fa1ab4c7a96436f806f", "DOMINGO": "recipe_altaprot_4aa72d85e61748c78106"}}, "listaCompraBase4pax": {"carnesPescadosHuevos": ["Pollo 1,2 kg", "Pavo crudo 1,76 kg", "Lomo de cerdo 580 g", "Ternera magra 800 g", "Merluza 1,96 kg", "Salmón 500 g", "Sepia limpia 1,1 kg", "Gambas limpias 1,46 kg", "Huevos 16", "Atún al natural 600 g escurridos"], "verdurasHortalizas": ["Calabacín 4,1 kg", "Tomate 2,6 kg", "Champiñones 1,5 kg", "Pepino 1,3 kg", "Espárragos 1,2 kg", "Cebolla 900 g", "Espinacas 800 g", "Zanahoria 800 g", "Judías verdes 600 g", "Berenjena 600 g", "Cogollos 4", "Puerro 400 g", "Canónigos 400 g", "Pimiento rojo 300 g", "Ajo 2 cabezas", "Perejil 2 manojos", "Limones 4"], "carbohidratosLegumbre": ["Patata 1,52 kg", "Boniato 540 g", "Lentejas en conserva 760 g escurridas", "Arroz 320 g en crudo", "Pasta o fideos 160 g en crudo", "Pan de media mañana 280 g", "Pan o crackers de desayuno 280 g (solo si se elige esta opción)"], "frutaYDespensa": ["Fruta 28 piezas (7 por persona/semana)", "Aceite de oliva: 750 ml", "Aceitunas 80 g", "Caldo casero desgrasado", "Vinagre, sal, pimienta, ajo, pimentón, comino, curry, tomillo, laurel, orégano, nuez moscada"]}}
  mealsJson.comida.recetasPorDia = {
    LUNES: ids["LUNES_COMIDA"], MARTES: ids["MARTES_COMIDA"], MIERCOLES: ids["MIERCOLES_COMIDA"],
    JUEVES: ids["JUEVES_COMIDA"], VIERNES: ids["VIERNES_COMIDA"], SABADO: ids["SABADO_COMIDA"], DOMINGO: ids["DOMINGO_COMIDA"],
  }
  mealsJson.cena.recetasPorDia = {
    LUNES: ids["LUNES_CENA"], MARTES: ids["MARTES_CENA"], MIERCOLES: ids["MIERCOLES_CENA"],
    JUEVES: ids["JUEVES_CENA"], VIERNES: ids["VIERNES_CENA"], SABADO: ids["SABADO_CENA"], DOMINGO: ids["DOMINGO_CENA"],
  }

  const equivalencesJson = {"ajustes": [{"concepto": "Pan de media mañana", "cantidad": "40 g por persona"}, {"concepto": "Desayuno", "cantidad": "Scoop de proteína o 40 g de pan/cracker, no ambos"}, {"concepto": "Sepia", "cantidad": "275 g por persona"}, {"concepto": "Atún al natural", "cantidad": "150 g escurridos por persona"}], "reglaGeneral": "Las cantidades de carne, pescado, huevos, legumbre y carbohidrato respetan la ración prescrita por persona. Se pesan en crudo, salvo las conservas, que se pesan escurridas. Especias, agua, caldo casero desgrasado, vinagre y limón se usan libremente sin salsas comerciales.", "advertencia": "Pesa el aceite y evita añadir quesos, frutos secos, aguacate o salsas fuera de las sustituciones indicadas. Las calorías exactas dependen de las marcas, el peso escurrido y la cantidad real de aceite utilizada."}

  return saveNutritionistPlan(userId, {
    extractedText:
      "Plan generado automáticamente a partir del menú semanal 'alta en proteínas' (14 recetas para 4 personas, lunes-domingo) al seleccionar este tipo de dieta en el perfil.",
    mealsJson: JSON.stringify(mealsJson),
    equivalencesJson: JSON.stringify(equivalencesJson),
    needsReview: true,
    version: 1,
  })
}
