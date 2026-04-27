export interface MealTracking {
  id: string
  fecha: Date
  tipoComida: "desayuno" | "mediaManana" | "almuerzo" | "merienda" | "cena"
  completado: boolean
  horaConsumida?: Date
  fotoPlato?: string
  caloriasReales?: number
  observaciones?: string
  cumpleConPlan: boolean
}

export interface ExerciseSet {
  repeticiones?: number
  peso?: number
  tiempo?: number // en segundos
  distancia?: number // en metros
}

export interface ExerciseTracking {
  id: string
  fecha: Date
  ejercicio: string
  sets: ExerciseSet[]
  completado: boolean
  duracionTotal: number // en segundos
  observaciones?: string
}

export interface Exercise {
  id: string
  nombre: string
  categoria: "fuerza" | "cardio" | "flexibilidad" | "funcional"
  equipamiento: string[]
  lugar: "casa" | "gimnasio" | "exterior"
  descripcion: string
  instrucciones: string[]
  grupoMuscular: string[]
  dificultad: "principiante" | "intermedio" | "avanzado"
  tipoMedicion: "repeticiones" | "tiempo" | "distancia"
}

export interface DailyProgress {
  fecha: Date
  comidasCompletadas: number
  totalComidas: number
  ejerciciosCompletados: number
  totalEjercicios: number
  caloriasConsumidas: number
  caloriasObjetivo: number
  aguaConsumida: number // en litros
  aguaObjetivo: number
  peso?: number
  energia: 1 | 2 | 3 | 4 | 5 // escala de energía
  animo: 1 | 2 | 3 | 4 | 5 // escala de ánimo
}

// Base de datos de ejercicios
export const ejerciciosDB: Exercise[] = [
  // Ejercicios de casa sin equipamiento
  {
    id: "flexiones",
    nombre: "Flexiones",
    categoria: "fuerza",
    equipamiento: ["Ninguno"],
    lugar: "casa",
    descripcion: "Ejercicio básico para fortalecer pecho, hombros y tríceps",
    instrucciones: [
      "Colócate en posición de plancha con las manos separadas al ancho de los hombros",
      "Baja el cuerpo hasta que el pecho casi toque el suelo",
      "Empuja hacia arriba hasta la posición inicial",
      "Mantén el cuerpo recto durante todo el movimiento",
    ],
    grupoMuscular: ["pecho", "hombros", "tríceps", "core"],
    dificultad: "principiante",
    tipoMedicion: "repeticiones",
  },
  {
    id: "sentadillas",
    nombre: "Sentadillas",
    categoria: "fuerza",
    equipamiento: ["Ninguno"],
    lugar: "casa",
    descripcion: "Ejercicio fundamental para fortalecer piernas y glúteos",
    instrucciones: [
      "Párate con los pies separados al ancho de los hombros",
      "Baja como si fueras a sentarte en una silla",
      "Mantén el peso en los talones",
      "Sube hasta la posición inicial",
    ],
    grupoMuscular: ["cuádriceps", "glúteos", "isquiotibiales"],
    dificultad: "principiante",
    tipoMedicion: "repeticiones",
  },
  {
    id: "plancha",
    nombre: "Plancha",
    categoria: "fuerza",
    equipamiento: ["Esterilla"],
    lugar: "casa",
    descripcion: "Ejercicio isométrico para fortalecer el core",
    instrucciones: [
      "Colócate boca abajo apoyado en antebrazos y puntas de los pies",
      "Mantén el cuerpo recto como una tabla",
      "Contrae el abdomen y mantén la posición",
      "Respira normalmente durante el ejercicio",
    ],
    grupoMuscular: ["core", "hombros"],
    dificultad: "principiante",
    tipoMedicion: "tiempo",
  },
  // Ejercicios con pesas
  {
    id: "press-banca-mancuernas",
    nombre: "Press de Banca con Mancuernas",
    categoria: "fuerza",
    equipamiento: ["Mancuernas"],
    lugar: "casa",
    descripcion: "Ejercicio para desarrollar el pecho con mancuernas",
    instrucciones: [
      "Acuéstate en un banco o en el suelo",
      "Sostén una mancuerna en cada mano a la altura del pecho",
      "Empuja las mancuernas hacia arriba hasta extender los brazos",
      "Baja controladamente hasta la posición inicial",
    ],
    grupoMuscular: ["pecho", "hombros", "tríceps"],
    dificultad: "intermedio",
    tipoMedicion: "repeticiones",
  },
  {
    id: "sentadillas-peso",
    nombre: "Sentadillas con Peso",
    categoria: "fuerza",
    equipamiento: ["Pesas", "Mancuernas"],
    lugar: "casa",
    descripcion: "Sentadillas con peso adicional para mayor intensidad",
    instrucciones: [
      "Sostén pesas o mancuernas a los lados o en los hombros",
      "Realiza el movimiento de sentadilla normal",
      "El peso adicional aumenta la resistencia",
      "Mantén la técnica correcta",
    ],
    grupoMuscular: ["cuádriceps", "glúteos", "isquiotibiales"],
    dificultad: "intermedio",
    tipoMedicion: "repeticiones",
  },
  // Ejercicios con gomas elásticas
  {
    id: "remo-gomas",
    nombre: "Remo con Gomas Elásticas",
    categoria: "fuerza",
    equipamiento: ["Gomas elásticas"],
    lugar: "casa",
    descripcion: "Ejercicio para fortalecer la espalda usando gomas elásticas",
    instrucciones: [
      "Ancla la goma a un punto fijo a la altura del pecho",
      "Tira de las gomas hacia tu cuerpo",
      "Aprieta los omóplatos al final del movimiento",
      "Regresa controladamente a la posición inicial",
    ],
    grupoMuscular: ["espalda", "bíceps"],
    dificultad: "principiante",
    tipoMedicion: "repeticiones",
  },
  // Ejercicios de cardio
  {
    id: "burpees",
    nombre: "Burpees",
    categoria: "cardio",
    equipamiento: ["Ninguno"],
    lugar: "casa",
    descripcion: "Ejercicio de cuerpo completo de alta intensidad",
    instrucciones: [
      "Comienza de pie",
      "Baja a posición de sentadilla y coloca las manos en el suelo",
      "Salta hacia atrás a posición de plancha",
      "Haz una flexión, salta hacia adelante y salta hacia arriba",
    ],
    grupoMuscular: ["cuerpo completo"],
    dificultad: "intermedio",
    tipoMedicion: "repeticiones",
  },
  {
    id: "saltar-cuerda",
    nombre: "Saltar la Cuerda",
    categoria: "cardio",
    equipamiento: ["Ninguno"],
    lugar: "casa",
    descripcion: "Ejercicio cardiovascular clásico",
    instrucciones: [
      "Sostén los extremos de la cuerda",
      "Gira la cuerda sobre tu cabeza",
      "Salta cuando la cuerda pase por debajo de tus pies",
      "Mantén un ritmo constante",
    ],
    grupoMuscular: ["pantorrillas", "cardio"],
    dificultad: "principiante",
    tipoMedicion: "tiempo",
  },
]

// Generar plan de ejercicios personalizado
export function generarPlanEjercicios(
  frecuenciaEntrenamiento: string,
  lugarEntrenamiento: string[],
  equipamiento: string[],
  dificultad: "principiante" | "intermedio" | "avanzado" = "principiante",
): Exercise[] {
  const lugaresNormalizados = lugarEntrenamiento.map((lugar) => {
    const lower = lugar.toLowerCase()
    if (lower.includes("gim")) return "gimnasio"
    if (lower.includes("ext") || lower.includes("parque")) return "exterior"
    return "casa"
  })

  // Filtrar ejercicios según equipamiento y lugar disponible
  const ejerciciosDisponibles = ejerciciosDB.filter((ejercicio) => {
    const tieneEquipamiento = ejercicio.equipamiento.some(
      (equipo) => equipamiento.includes(equipo) || equipo === "Ninguno",
    )
    const tieneUbicacion = lugaresNormalizados.some((lugar) => ejercicio.lugar === lugar)
    const nivelAdecuado = ejercicio.dificultad === dificultad || ejercicio.dificultad === "principiante"

    return tieneEquipamiento && tieneUbicacion && nivelAdecuado
  })

  const sesiones =
    frecuenciaEntrenamiento === "1-2"
      ? 3
      : frecuenciaEntrenamiento === "3-4"
        ? 5
        : frecuenciaEntrenamiento === "5-6"
          ? 7
          : 8

  // Seleccionar ejercicios balanceados por categoría
  const ejerciciosFuerza = ejerciciosDisponibles.filter((e) => e.categoria === "fuerza")
  const ejerciciosCardio = ejerciciosDisponibles.filter((e) => e.categoria === "cardio")
  const ejerciciosFlexibilidad = ejerciciosDisponibles.filter((e) => e.categoria === "flexibilidad")

  const planEjercicios: Exercise[] = []

  // Añadir ejercicios de fuerza (50% del plan)
  const numFuerza = Math.min(Math.ceil(sesiones * 0.5), ejerciciosFuerza.length)
  planEjercicios.push(...ejerciciosFuerza.slice(0, numFuerza))

  // Añadir ejercicios de cardio (30% del plan)
  const numCardio = Math.min(Math.max(2, Math.ceil(sesiones * 0.3)), ejerciciosCardio.length)
  planEjercicios.push(...ejerciciosCardio.slice(0, numCardio))

  // Añadir ejercicios de flexibilidad (20% del plan)
  const numFlex = Math.min(Math.max(1, sesiones - numFuerza - numCardio), ejerciciosFlexibilidad.length)
  planEjercicios.push(...ejerciciosFlexibilidad.slice(0, numFlex))

  return planEjercicios
}

// Calcular nivel de experiencia basado en perfil del usuario
export function calcularNivelEntrenamiento(params: {
  age: number
  sex: string
  weight: number
  height: number
  trainingFrequency?: string
  experienceLevel?: string
}): "principiante" | "intermedio" | "avanzado" {
  const { age, sex, weight, height, trainingFrequency, experienceLevel } = params

  // Si tiene nivel explícito, usarlo
  if (experienceLevel === "avanzado") return "avanzado"
  if (experienceLevel === "intermedio") return "intermedio"

  // Calcular BMI
  const heightM = height / 100
  const bmi = weight / (heightM * heightM)

  // Calcular edad metabólica aproximada
  const isYoung = age < 35
  const isSenior = age > 55

  // Calcular nivel basado en múltiples factores
  let score = 0

  // Frecuencia de entrenamiento
  if (trainingFrequency === "5-6" || trainingFrequency === "diario") score += 3
  else if (trainingFrequency === "3-4") score += 2
  else if (trainingFrequency === "1-2") score += 1

  // Edad
  if (isYoung) score += 2
  else if (age >= 35 && age <= 55) score += 1

  // BMI (no es indicador de condición física pero afecta recomendación)
  if (bmi >= 18.5 && bmi <= 25) score += 1
  else if (bmi > 30 || bmi < 18.5) score -= 1

  // Determinar nivel
  if (score >= 5) return "avanzado"
  if (score >= 3) return "intermedio"
  return "principiante"
}

// Obtener recomendaciones personalizadas de ejercicio
export function obtenerRecomendacionesEjercicio(params: {
  age: number
  sex: string
  weight: number
  height: number
  objetivo: "perder" | "mantener" | "ganar"
  lugarEntrenamiento: string[]
  equipamiento: string[]
  condiciones?: string[]
}): { recommendation: string; exercises: Exercise[]; precautions: string[] } {
  const { age, sex, weight, height, objetivo, lugarEntrenamiento, equipamiento, condiciones } = params
  const nivel = calcularNivelEntrenamiento({ age, sex, weight, height })
  const plan = generarPlanEjercicios(
    "3-4",
    lugarEntrenamiento,
    equipamiento,
    nivel,
  )

  const precautions: string[] = []
  const recommendation: string[] = []

  // Recomendaciones según objetivo
  if (objetivo === "perder") {
    recommendation.push("Enfócate en ejercicios de cardio y HIIT para maximizar la quema de grasa")
    if (age > 50) precautions.push("Evita ejercicios de alto impacto, opta por caminatas o natación")
  } else if (objetivo === "ganar") {
    recommendation.push("Prioriza ejercicios de fuerza con mayor carga y menor reps")
    if (age > 40) precautions.push("Asegúrate de calentar bien y usar重量 progresivo")
  } else {
    recommendation.push("Mantén un equilibrio entre fuerza y cardio para mantener condición física")
  }

  // Recomendaciones según edad
  if (age > 60) {
    precautions.push("Incluye ejercicios de equilibrio y movilidad")
    precautions.push("Reduce intensidad y aumenta descanso")
  }
  if (age < 18) {
    precautions.push("Evita cargas pesadas, enfócate en peso corporal")
  }

  // Recomendaciones según sexo
  if (sex === "mujer" && weight > height - 100) {
    precautions.push("Integra ejercicios de suelo pélvico en tu rutina")
  }

  // Recomendaciones según condiciones
  if (condiciones?.includes("corazon")) {
    precautions.push("Consulta con cardiólogo antes de comenzar")
    precautions.push("Mantén intensidad moderada (zona 2-3)")
  }
  if (condiciones?.includes("articulaciones")) {
    precautions.push("Evita impactos, opta por ejercicios de bajo impacto")
    plan.forEach(e => {
      if (e.nombre.toLowerCase().includes("salt") || e.nombre.toLowerCase().includes("burpee")) {
        e.dificultad = "principiante"
      }
    })
  }

  return {
    recommendation: recommendation.join(" "),
    exercises: plan,
    precautions,
  }
}

// Analizar foto de comida (simulado)
export function analizarFotoComida(fotoUrl: string): Promise<{
  cumpleConPlan: boolean
  caloriasEstimadas: number
  ingredientesDetectados: string[]
  recomendaciones: string[]
}> {
  // Simulación de análisis de IA
  return new Promise((resolve) => {
    setTimeout(() => {
      const resultadosSimulados = [
        {
          cumpleConPlan: true,
          caloriasEstimadas: 420,
          ingredientesDetectados: ["pollo", "brócoli", "arroz integral"],
          recomendaciones: ["Excelente elección, cumple perfectamente con tu plan nutricional"],
        },
        {
          cumpleConPlan: false,
          caloriasEstimadas: 680,
          ingredientesDetectados: ["pizza", "queso", "pepperoni"],
          recomendaciones: ["Esta comida excede las calorías recomendadas", "Considera una porción más pequeña"],
        },
        {
          cumpleConPlan: true,
          caloriasEstimadas: 320,
          ingredientesDetectados: ["salmón", "espinacas", "aguacate"],
          recomendaciones: ["Perfecto balance de proteínas y grasas saludables"],
        },
      ]

      const resultado = resultadosSimulados[Math.floor(Math.random() * resultadosSimulados.length)]
      resolve(resultado)
    }, 2000)
  })
}

// Calcular estadísticas de progreso
export function calcularEstadisticasProgreso(progresoDiario: DailyProgress[]): {
  adherenciaComidas: number
  adherenciaEjercicios: number
  promedioEnergia: number
  promedioAnimo: number
  tendenciaPeso: "subiendo" | "bajando" | "estable"
  diasConsecutivos: number
} {
  if (progresoDiario.length === 0) {
    return {
      adherenciaComidas: 0,
      adherenciaEjercicios: 0,
      promedioEnergia: 0,
      promedioAnimo: 0,
      tendenciaPeso: "estable",
      diasConsecutivos: 0,
    }
  }

  const totalComidas = progresoDiario.reduce((sum, dia) => sum + dia.totalComidas, 0)
  const comidasCompletadas = progresoDiario.reduce((sum, dia) => sum + dia.comidasCompletadas, 0)
  const totalEjercicios = progresoDiario.reduce((sum, dia) => sum + dia.totalEjercicios, 0)
  const ejerciciosCompletados = progresoDiario.reduce((sum, dia) => sum + dia.ejerciciosCompletados, 0)

  const adherenciaComidas = totalComidas > 0 ? (comidasCompletadas / totalComidas) * 100 : 0
  const adherenciaEjercicios = totalEjercicios > 0 ? (ejerciciosCompletados / totalEjercicios) * 100 : 0

  const promedioEnergia = progresoDiario.reduce((sum, dia) => sum + dia.energia, 0) / progresoDiario.length
  const promedioAnimo = progresoDiario.reduce((sum, dia) => sum + dia.animo, 0) / progresoDiario.length

  // Calcular tendencia de peso
  const pesosRegistrados = progresoDiario.filter((dia) => dia.peso).map((dia) => dia.peso!)
  let tendenciaPeso: "subiendo" | "bajando" | "estable" = "estable"

  if (pesosRegistrados.length >= 2) {
    const pesoInicial = pesosRegistrados[0]
    const pesoFinal = pesosRegistrados[pesosRegistrados.length - 1]
    const diferencia = pesoFinal - pesoInicial

    if (diferencia > 0.5) tendenciaPeso = "subiendo"
    else if (diferencia < -0.5) tendenciaPeso = "bajando"
  }

  // Calcular días consecutivos de adherencia
  let diasConsecutivos = 0
  for (let i = progresoDiario.length - 1; i >= 0; i--) {
    const dia = progresoDiario[i]
    const adherenciaTotal =
      (dia.comidasCompletadas / dia.totalComidas + dia.ejerciciosCompletados / dia.totalEjercicios) / 2
    if (adherenciaTotal >= 0.8) {
      // 80% de adherencia
      diasConsecutivos++
    } else {
      break
    }
  }

  return {
    adherenciaComidas,
    adherenciaEjercicios,
    promedioEnergia,
    promedioAnimo,
    tendenciaPeso,
    diasConsecutivos,
  }
}

// Generar recomendaciones personalizadas
export function generarRecomendaciones(
  progresoDiario: DailyProgress[],
  estadisticas: ReturnType<typeof calcularEstadisticasProgreso>,
): string[] {
  const recomendaciones: string[] = []

  if (estadisticas.adherenciaComidas < 70) {
    recomendaciones.push("Intenta mejorar la adherencia a tu plan nutricional. Planifica tus comidas con anticipación.")
  }

  if (estadisticas.adherenciaEjercicios < 60) {
    recomendaciones.push(
      "Considera reducir la intensidad o duración de tus entrenamientos para mantener la consistencia.",
    )
  }

  if (estadisticas.promedioEnergia < 3) {
    recomendaciones.push(
      "Tu nivel de energía está bajo. Asegúrate de dormir lo suficiente y mantener una hidratación adecuada.",
    )
  }

  if (estadisticas.promedioAnimo < 3) {
    recomendaciones.push("Considera incluir actividades que disfrutes en tu rutina para mejorar tu estado de ánimo.")
  }

  if (estadisticas.diasConsecutivos >= 7) {
    recomendaciones.push("¡Excelente! Has mantenido una buena adherencia durante una semana completa.")
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push("¡Vas muy bien! Mantén el buen trabajo y la consistencia.")
  }

  return recomendaciones
}
