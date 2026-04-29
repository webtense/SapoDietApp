export interface NutritionalNeeds {
  calories: number
  protein: number // gramos
  carbs: number // gramos
  fat: number // gramos
  fiber: number // gramos
  water: number // litros
}

export interface MealPlan {
  desayuno: Meal
  mediaManana: Meal
  almuerzo: Meal
  merienda: Meal
  cena: Meal
}

export interface Meal {
  nombre: string
  ingredientes: Ingredient[]
  instrucciones: string[]
  calorias: number
  proteinas: number
  carbohidratos: number
  grasas: number
  tiempoPreparacion: number
}

export interface Ingredient {
  nombre: string
  cantidad: number
  unidad: string
  calorias: number
  proteinas: number
  carbohidratos: number
  grasas: number
}

// Fórmula de Harris-Benedict revisada para calcular metabolismo basal
export function calcularMetabolismoBasal(peso: number, altura: number, edad: number, sexo: "hombre" | "mujer"): number {
  if (sexo === "hombre") {
    return 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * edad
  } else {
    return 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * edad
  }
}

// Factor de actividad según frecuencia de entrenamiento
export function obtenerFactorActividad(frecuenciaEntrenamiento: string): number {
  switch (frecuenciaEntrenamiento) {
    case "1-2":
      return 1.375 // Ligera actividad
    case "3-4":
      return 1.55 // Actividad moderada
    case "5-6":
      return 1.725 // Actividad intensa
    case "diario":
      return 1.9 // Muy activo
    default:
      return 1.2 // Sedentario
  }
}

// Calcular necesidades calóricas totales
export function calcularNecesidadesCaloricas(
  peso: number,
  altura: number,
  edad: number,
  sexo: "hombre" | "mujer",
  frecuenciaEntrenamiento: string,
  objetivo: "perder" | "mantener" | "ganar",
): number {
  const metabolismoBasal = calcularMetabolismoBasal(peso, altura, edad, sexo)
  const factorActividad = obtenerFactorActividad(frecuenciaEntrenamiento)
  const caloriasTotales = metabolismoBasal * factorActividad

  // Ajustar según objetivo
  switch (objetivo) {
    case "perder":
      return caloriasTotales - 500 // Déficit de 500 cal para perder ~0.5kg/semana
    case "ganar":
      return caloriasTotales + 300 // Superávit de 300 cal para ganar peso gradualmente
    default:
      return caloriasTotales
  }
}

// Calcular distribución de macronutrientes según tipo de dieta
export function calcularMacronutrientes(calorias: number, tipoDieta: string): NutritionalNeeds {
  let proteinPercent = 0.2
  let carbPercent = 0.5
  let fatPercent = 0.3

  switch (tipoDieta) {
    case "Keto":
      proteinPercent = 0.25
      carbPercent = 0.05
      fatPercent = 0.7
      break
    case "Alta en proteínas":
      proteinPercent = 0.35
      carbPercent = 0.35
      fatPercent = 0.3
      break
    case "Baja en carbohidratos":
      proteinPercent = 0.3
      carbPercent = 0.2
      fatPercent = 0.5
      break
    case "Mediterránea":
      proteinPercent = 0.15
      carbPercent = 0.55
      fatPercent = 0.3
      break
    case "Vegetariana":
    case "Vegana":
      proteinPercent = 0.18
      carbPercent = 0.55
      fatPercent = 0.27
      break
  }

  return {
    calories: Math.round(calorias),
    protein: Math.round((calorias * proteinPercent) / 4), // 4 cal/g proteína
    carbs: Math.round((calorias * carbPercent) / 4), // 4 cal/g carbohidrato
    fat: Math.round((calorias * fatPercent) / 9), // 9 cal/g grasa
    fiber: Math.round(Math.max(25, calorias / 100)), // Mínimo 25g, idealmente 1g por cada 100 cal
    water: Number((Math.max(2, calorias / 1000)).toFixed(1)), // Mínimo 2L, idealmente 1L por cada 1000 cal
  }
}

// Base de datos de ingredientes comunes (simplificada)
export const ingredientesDB: Record<string, Omit<Ingredient, "cantidad">> = {
  // Proteínas
  "pechuga de pollo": {
    nombre: "Pechuga de pollo",
    unidad: "g",
    calorias: 1.65,
    proteinas: 0.31,
    carbohidratos: 0,
    grasas: 0.036,
  },
  salmón: { nombre: "Salmón", unidad: "g", calorias: 2.08, proteinas: 0.25, carbohidratos: 0, grasas: 0.12 },
  huevos: { nombre: "Huevos", unidad: "unidad", calorias: 70, proteinas: 6, carbohidratos: 0.6, grasas: 5 },
  lentejas: { nombre: "Lentejas", unidad: "g", calorias: 1.16, proteinas: 0.09, carbohidratos: 0.2, grasas: 0.004 },

  // Carbohidratos
  "arroz integral": {
    nombre: "Arroz integral",
    unidad: "g",
    calorias: 1.11,
    proteinas: 0.023,
    carbohidratos: 0.23,
    grasas: 0.009,
  },
  avena: { nombre: "Avena", unidad: "g", calorias: 3.89, proteinas: 0.169, carbohidratos: 0.664, grasas: 0.069 },
  quinoa: { nombre: "Quinoa", unidad: "g", calorias: 1.2, proteinas: 0.044, carbohidratos: 0.22, grasas: 0.019 },
  batata: { nombre: "Batata", unidad: "g", calorias: 0.86, proteinas: 0.02, carbohidratos: 0.2, grasas: 0.001 },

  // Verduras
  brócoli: { nombre: "Brócoli", unidad: "g", calorias: 0.34, proteinas: 0.028, carbohidratos: 0.07, grasas: 0.004 },
  espinacas: {
    nombre: "Espinacas",
    unidad: "g",
    calorias: 0.23,
    proteinas: 0.029,
    carbohidratos: 0.036,
    grasas: 0.004,
  },
  tomate: { nombre: "Tomate", unidad: "g", calorias: 0.18, proteinas: 0.009, carbohidratos: 0.039, grasas: 0.002 },

  // Grasas saludables
  aguacate: { nombre: "Aguacate", unidad: "g", calorias: 1.6, proteinas: 0.02, carbohidratos: 0.085, grasas: 0.147 },
  "aceite de oliva": {
    nombre: "Aceite de oliva",
    unidad: "ml",
    calorias: 8.84,
    proteinas: 0,
    carbohidratos: 0,
    grasas: 1,
  },
  almendras: {
    nombre: "Almendras",
    unidad: "g",
    calorias: 5.79,
    proteinas: 0.211,
    carbohidratos: 0.219,
    grasas: 0.497,
  },

  // Frutas
  plátano: { nombre: "Plátano", unidad: "unidad", calorias: 89, proteinas: 1.1, carbohidratos: 23, grasas: 0.3 },
  manzana: { nombre: "Manzana", unidad: "unidad", calorias: 52, proteinas: 0.3, carbohidratos: 14, grasas: 0.2 },
  naranja: { nombre: "Naranja", unidad: "unidad", calorias: 47, proteinas: 0.9, carbohidratos: 12, grasas: 0.1 },
}

function generarMealSuplemento(tipo: "desayuno" | "merienda"): Meal {
  return {
    nombre: "Batido Fórmula 1 Herbalife",
    ingredientes: [
      { nombre: "Fórmula 1 Herbalife", cantidad: 52, unidad: "g", calorias: 186, proteinas: 18, carbohidratos: 22, grasas: 3 },
      { nombre: "Leche desnatada", cantidad: 250, unidad: "ml", calorias: 90, proteinas: 9, carbohidratos: 12, grasas: 0.5 },
    ],
    instrucciones: [
      "Mezcla 2 medidas rasas (52 g) de Fórmula 1 con 250 ml de leche desnatada fría.",
      "Bate o agita bien hasta que no queden grumos.",
      tipo === "desayuno"
        ? "Tómalo como sustituto completo del desayuno."
        : "Sustituto de la merienda. Puedes añadir hielo o fruta fresca.",
    ],
    calorias: 276,
    proteinas: 24,
    carbohidratos: 30,
    grasas: 4,
  }
}

// Generar plan de comidas personalizado
export function generarPlanComidas(
  necesidades: NutritionalNeeds,
  tipoDieta: string,
  alimentosNoPermitidos: string[],
  horaAlmorzar: string,
  supplementBrand = "",
): MealPlan {
  const alimentosExcluidos = alimentosNoPermitidos.map((a) => a.toLowerCase())
  const usaHerbalife = supplementBrand === "herbalife"

  const distribucionCalorica = {
    desayuno: 0.25,
    mediaManana: 0.1,
    almuerzo: 0.35,
    merienda: 0.1,
    cena: 0.2,
  }

  return {
    desayuno: usaHerbalife
      ? generarMealSuplemento("desayuno")
      : generarComida("desayuno", necesidades.calories * distribucionCalorica.desayuno, tipoDieta, alimentosExcluidos),
    mediaManana: generarComida(
      "media mañana",
      necesidades.calories * distribucionCalorica.mediaManana,
      tipoDieta,
      alimentosExcluidos,
    ),
    almuerzo: generarComida(
      "almuerzo",
      necesidades.calories * distribucionCalorica.almuerzo,
      tipoDieta,
      alimentosExcluidos,
    ),
    merienda: usaHerbalife
      ? generarMealSuplemento("merienda")
      : generarComida("merienda", necesidades.calories * distribucionCalorica.merienda, tipoDieta, alimentosExcluidos),
    cena: generarComida("cena", necesidades.calories * distribucionCalorica.cena, tipoDieta, alimentosExcluidos),
  }
}

function generarComida(
  tipoComida: string,
  caloriasObjetivo: number,
  tipoDieta: string,
  alimentosExcluidos: string[],
): Meal {
  // Seleccionar ingredientes según el tipo de comida y dieta
  const ingredientesDisponibles = Object.entries(ingredientesDB).filter(
    ([nombre]) => !alimentosExcluidos.some((excluido) => nombre.includes(excluido.toLowerCase())),
  )

  // Lógica simplificada para generar comidas
  switch (tipoComida) {
    case "desayuno":
      return generarDesayuno(caloriasObjetivo, tipoDieta, ingredientesDisponibles)
    case "almuerzo":
      return generarAlmuerzo(caloriasObjetivo, tipoDieta, ingredientesDisponibles)
    case "cena":
      return generarCena(caloriasObjetivo, tipoDieta, ingredientesDisponibles)
    default:
      return generarSnack(tipoComida, caloriasObjetivo, ingredientesDisponibles)
  }
}

function generarDesayuno(
  calorias: number,
  tipoDieta: string,
  ingredientes: [string, Omit<Ingredient, "cantidad">][],
): Meal {
  if (tipoDieta === "Keto") {
    return {
      nombre: "Desayuno Keto - Huevos con Aguacate",
      ingredientes: [
        { ...ingredientesDB["huevos"], cantidad: 2 },
        { ...ingredientesDB["aguacate"], cantidad: 100 },
        { ...ingredientesDB["aceite de oliva"], cantidad: 10 },
      ],
      instrucciones: [
        "Calentar aceite de oliva en una sartén",
        "Batir los huevos y cocinar como revueltos",
        "Servir con aguacate en rodajas",
        "Sazonar con sal y pimienta al gusto",
      ],
      calorias: 450,
      proteinas: 17,
      carbohidratos: 8,
      grasas: 40,
      tiempoPreparacion: 10,
    }
  }

  return {
    nombre: "Desayuno Mediterráneo - Avena con Frutas",
    ingredientes: [
      { ...ingredientesDB["avena"], cantidad: 50 },
      { ...ingredientesDB["plátano"], cantidad: 1 },
      { ...ingredientesDB["almendras"], cantidad: 20 },
    ],
    instrucciones: [
      "Cocinar la avena con agua o leche vegetal",
      "Añadir el plátano en rodajas",
      "Decorar con almendras troceadas",
      "Endulzar con miel si se desea",
    ],
    calorias: 350,
    proteinas: 12,
    carbohidratos: 55,
    grasas: 12,
    tiempoPreparacion: 8,
  }
}

function generarAlmuerzo(
  calorias: number,
  tipoDieta: string,
  ingredientes: [string, Omit<Ingredient, "cantidad">][],
): Meal {
  return {
    nombre: "Almuerzo Equilibrado - Pollo con Quinoa y Verduras",
    ingredientes: [
      { ...ingredientesDB["pechuga de pollo"], cantidad: 150 },
      { ...ingredientesDB["quinoa"], cantidad: 80 },
      { ...ingredientesDB["brócoli"], cantidad: 200 },
      { ...ingredientesDB["aceite de oliva"], cantidad: 15 },
    ],
    instrucciones: [
      "Cocinar la quinoa según las instrucciones del paquete",
      "Sazonar y cocinar el pollo a la plancha",
      "Cocer el brócoli al vapor",
      "Servir todo junto con un chorrito de aceite de oliva",
    ],
    calorias: 520,
    proteinas: 45,
    carbohidratos: 35,
    grasas: 18,
    tiempoPreparacion: 25,
  }
}

function generarCena(
  calorias: number,
  tipoDieta: string,
  ingredientes: [string, Omit<Ingredient, "cantidad">][],
): Meal {
  return {
    nombre: "Cena Ligera - Salmón con Verduras",
    ingredientes: [
      { ...ingredientesDB["salmón"], cantidad: 120 },
      { ...ingredientesDB["espinacas"], cantidad: 150 },
      { ...ingredientesDB["tomate"], cantidad: 100 },
      { ...ingredientesDB["aceite de oliva"], cantidad: 10 },
    ],
    instrucciones: [
      "Cocinar el salmón a la plancha con un poco de aceite",
      "Saltear las espinacas con ajo",
      "Preparar ensalada de tomate",
      "Servir el salmón sobre las verduras",
    ],
    calorias: 380,
    proteinas: 32,
    carbohidratos: 8,
    grasas: 25,
    tiempoPreparacion: 15,
  }
}

function generarSnack(nombre: string, calorias: number, ingredientes: [string, Omit<Ingredient, "cantidad">][]): Meal {
  return {
    nombre: `${nombre} - Fruta con Frutos Secos`,
    ingredientes: [
      { ...ingredientesDB["manzana"], cantidad: 1 },
      { ...ingredientesDB["almendras"], cantidad: 15 },
    ],
    instrucciones: ["Lavar y cortar la manzana en rodajas", "Servir con almendras naturales"],
    calorias: 140,
    proteinas: 4,
    carbohidratos: 18,
    grasas: 8,
    tiempoPreparacion: 2,
  }
}
