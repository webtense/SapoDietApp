import type { MealPlan, Ingredient } from "./diet-calculator"

export interface ShoppingItem {
  id?: string
  nombre: string
  cantidad: number
  unidad: string
  categoria: string
  pasillo: string
  comprado: boolean
  precioEstimado?: number
}

export interface ShoppingList {
  items: ShoppingItem[]
  totalEstimado: number
  supermercado: string
  fechaCreacion: Date
}

// Mapeo de ingredientes a categorías y pasillos por supermercado
export const categoriasSupermercado: Record<
  string,
  Record<string, { categoria: string; pasillo: string; precioKg?: number }>
> = {
  Mercadona: {
    "pechuga de pollo": { categoria: "Carnes y Pescados", pasillo: "Carnicería", precioKg: 6.5 },
    salmón: { categoria: "Carnes y Pescados", pasillo: "Pescadería", precioKg: 12.9 },
    huevos: { categoria: "Lácteos y Huevos", pasillo: "Refrigerados", precioKg: 2.2 },
    lentejas: { categoria: "Legumbres y Conservas", pasillo: "Conservas", precioKg: 2.8 },
    "arroz integral": { categoria: "Cereales y Pasta", pasillo: "Cereales", precioKg: 1.95 },
    avena: { categoria: "Cereales y Pasta", pasillo: "Cereales", precioKg: 2.4 },
    quinoa: { categoria: "Cereales y Pasta", pasillo: "Cereales", precioKg: 4.5 },
    batata: { categoria: "Frutas y Verduras", pasillo: "Verduras", precioKg: 1.8 },
    brócoli: { categoria: "Frutas y Verduras", pasillo: "Verduras", precioKg: 2.95 },
    espinacas: { categoria: "Frutas y Verduras", pasillo: "Verduras", precioKg: 3.2 },
    tomate: { categoria: "Frutas y Verduras", pasillo: "Verduras", precioKg: 2.5 },
    aguacate: { categoria: "Frutas y Verduras", pasillo: "Frutas", precioKg: 4.8 },
    "aceite de oliva": { categoria: "Aceites y Vinagres", pasillo: "Condimentos", precioKg: 8.5 },
    almendras: { categoria: "Frutos Secos", pasillo: "Frutos Secos", precioKg: 12.5 },
    plátano: { categoria: "Frutas y Verduras", pasillo: "Frutas", precioKg: 1.6 },
    manzana: { categoria: "Frutas y Verduras", pasillo: "Frutas", precioKg: 2.2 },
    naranja: { categoria: "Frutas y Verduras", pasillo: "Frutas", precioKg: 1.8 },
  },
  Carrefour: {
    "pechuga de pollo": { categoria: "Carnes y Aves", pasillo: "Carnicería", precioKg: 6.8 },
    salmón: { categoria: "Pescados y Mariscos", pasillo: "Pescadería", precioKg: 13.5 },
    huevos: { categoria: "Lácteos", pasillo: "Refrigerados", precioKg: 2.4 },
    lentejas: { categoria: "Legumbres", pasillo: "Conservas y Legumbres", precioKg: 3.0 },
    "arroz integral": { categoria: "Arroces y Cereales", pasillo: "Cereales", precioKg: 2.1 },
    avena: { categoria: "Arroces y Cereales", pasillo: "Cereales", precioKg: 2.6 },
    quinoa: { categoria: "Arroces y Cereales", pasillo: "Cereales", precioKg: 4.8 },
    batata: { categoria: "Verduras", pasillo: "Frutas y Verduras", precioKg: 1.95 },
    brócoli: { categoria: "Verduras", pasillo: "Frutas y Verduras", precioKg: 3.1 },
    espinacas: { categoria: "Verduras", pasillo: "Frutas y Verduras", precioKg: 3.4 },
    tomate: { categoria: "Verduras", pasillo: "Frutas y Verduras", precioKg: 2.7 },
    aguacate: { categoria: "Frutas", pasillo: "Frutas y Verduras", precioKg: 5.2 },
    "aceite de oliva": { categoria: "Aceites", pasillo: "Aceites y Vinagres", precioKg: 9.0 },
    almendras: { categoria: "Frutos Secos", pasillo: "Frutos Secos y Snacks", precioKg: 13.2 },
    plátano: { categoria: "Frutas", pasillo: "Frutas y Verduras", precioKg: 1.7 },
    manzana: { categoria: "Frutas", pasillo: "Frutas y Verduras", precioKg: 2.4 },
    naranja: { categoria: "Frutas", pasillo: "Frutas y Verduras", precioKg: 1.95 },
  },
  Lidl: {
    "pechuga de pollo": { categoria: "Carnes", pasillo: "Carnicería", precioKg: 5.99 },
    salmón: { categoria: "Pescados", pasillo: "Congelados", precioKg: 11.99 },
    huevos: { categoria: "Lácteos", pasillo: "Refrigerados", precioKg: 1.99 },
    lentejas: { categoria: "Conservas", pasillo: "Conservas", precioKg: 2.49 },
    "arroz integral": { categoria: "Cereales", pasillo: "Cereales y Pasta", precioKg: 1.79 },
    avena: { categoria: "Cereales", pasillo: "Cereales y Pasta", precioKg: 2.19 },
    quinoa: { categoria: "Cereales", pasillo: "Cereales y Pasta", precioKg: 3.99 },
    batata: { categoria: "Verduras", pasillo: "Frutas y Verduras", precioKg: 1.69 },
    brócoli: { categoria: "Verduras", pasillo: "Frutas y Verduras", precioKg: 2.79 },
    espinacas: { categoria: "Verduras", pasillo: "Frutas y Verduras", precioKg: 2.99 },
    tomate: { categoria: "Verduras", pasillo: "Frutas y Verduras", precioKg: 2.29 },
    aguacate: { categoria: "Frutas", pasillo: "Frutas y Verduras", precioKg: 4.49 },
    "aceite de oliva": { categoria: "Aceites", pasillo: "Aceites y Condimentos", precioKg: 7.99 },
    almendras: { categoria: "Frutos Secos", pasillo: "Snacks", precioKg: 11.99 },
    plátano: { categoria: "Frutas", pasillo: "Frutas y Verduras", precioKg: 1.49 },
    manzana: { categoria: "Frutas", pasillo: "Frutas y Verduras", precioKg: 1.99 },
    naranja: { categoria: "Frutas", pasillo: "Frutas y Verduras", precioKg: 1.69 },
  },
}

// Generar lista de compra desde plan de comidas
export function generarListaCompra(planComidas: MealPlan, supermercado: string, diasSemana = 7): ShoppingList {
  const ingredientesConsolidados = consolidarIngredientes(planComidas, diasSemana)
  const categoriasSuper = categoriasSupermercado[supermercado] || categoriasSupermercado["Mercadona"]

  const items: ShoppingItem[] = ingredientesConsolidados.map((ingrediente) => {
    const infoSuper = categoriasSuper[ingrediente.nombre.toLowerCase()] || {
      categoria: "Otros",
      pasillo: "Varios",
      precioKg: 3.0,
    }

    const precioEstimado = calcularPrecioEstimado(ingrediente, infoSuper.precioKg || 3.0)

    return {
      nombre: ingrediente.nombre,
      cantidad: ingrediente.cantidad,
      unidad: ingrediente.unidad,
      categoria: infoSuper.categoria,
      pasillo: infoSuper.pasillo,
      comprado: false,
      precioEstimado,
    }
  })

  // Ordenar por pasillo para facilitar la compra
  items.sort((a, b) => {
    if (a.pasillo !== b.pasillo) {
      return a.pasillo.localeCompare(b.pasillo)
    }
    return a.categoria.localeCompare(b.categoria)
  })

  const totalEstimado = items.reduce((sum, item) => sum + (item.precioEstimado || 0), 0)

  return {
    items,
    totalEstimado,
    supermercado,
    fechaCreacion: new Date(),
  }
}

// Consolidar ingredientes repetidos sumando cantidades
function consolidarIngredientes(planComidas: MealPlan, diasSemana: number): Ingredient[] {
  const ingredientesMap = new Map<string, Ingredient>()

  // Recopilar todos los ingredientes de todas las comidas
  const todasLasComidas = [
    planComidas.desayuno,
    planComidas.mediaManana,
    planComidas.almuerzo,
    planComidas.merienda,
    planComidas.cena,
  ]

  todasLasComidas.forEach((comida) => {
    comida.ingredientes.forEach((ingrediente) => {
      const key = ingrediente.nombre.toLowerCase()
      const cantidadSemanal = ingrediente.cantidad * diasSemana

      if (ingredientesMap.has(key)) {
        const existente = ingredientesMap.get(key)!
        // Solo sumar si las unidades coinciden
        if (existente.unidad === ingrediente.unidad) {
          existente.cantidad += cantidadSemanal
        } else {
          // Si las unidades no coinciden, crear entrada separada
          const keyConUnidad = `${key}_${ingrediente.unidad}`
          ingredientesMap.set(keyConUnidad, {
            ...ingrediente,
            cantidad: cantidadSemanal,
          })
        }
      } else {
        ingredientesMap.set(key, {
          ...ingrediente,
          cantidad: cantidadSemanal,
        })
      }
    })
  })

  return Array.from(ingredientesMap.values())
}

// Calcular precio estimado basado en cantidad y precio por kg/unidad
function calcularPrecioEstimado(ingrediente: Ingredient, precioKg: number): number {
  if (ingrediente.unidad === "g") {
    return (ingrediente.cantidad / 1000) * precioKg
  } else if (ingrediente.unidad === "ml") {
    return (ingrediente.cantidad / 1000) * precioKg
  } else if (ingrediente.unidad === "unidad") {
    // Precio promedio por unidad (estimado)
    const precioUnidad = precioKg / 10 // Asumiendo ~10 unidades por kg
    return ingrediente.cantidad * precioUnidad
  }

  return ingrediente.cantidad * precioKg
}

// Obtener orden de pasillos recomendado para compra eficiente
export function obtenerOrdenPasillos(supermercado: string): string[] {
  const ordenesComunes: Record<string, string[]> = {
    Mercadona: [
      "Frutas y Verduras",
      "Carnicería",
      "Pescadería",
      "Refrigerados",
      "Lácteos y Huevos",
      "Cereales",
      "Conservas",
      "Condimentos",
      "Frutos Secos",
    ],
    Carrefour: [
      "Frutas y Verduras",
      "Carnicería",
      "Pescadería",
      "Refrigerados",
      "Cereales",
      "Conservas y Legumbres",
      "Aceites y Vinagres",
      "Frutos Secos y Snacks",
    ],
    Lidl: [
      "Frutas y Verduras",
      "Carnicería",
      "Congelados",
      "Refrigerados",
      "Cereales y Pasta",
      "Conservas",
      "Aceites y Condimentos",
      "Snacks",
    ],
  }

  return ordenesComunes[supermercado] || ordenesComunes["Mercadona"]
}

// Agrupar items por pasillo
export function agruparPorPasillo(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  return items.reduce(
    (grupos, item) => {
      const pasillo = item.pasillo
      if (!grupos[pasillo]) {
        grupos[pasillo] = []
      }
      grupos[pasillo].push(item)
      return grupos
    },
    {} as Record<string, ShoppingItem[]>,
  )
}

// Calcular estadísticas de la lista
export function calcularEstadisticas(lista: ShoppingList): {
  totalItems: number
  itemsComprados: number
  porcentajeCompletado: number
  totalGastado: number
  ahorroEstimado: number
} {
  const totalItems = lista.items.length
  const itemsComprados = lista.items.filter((item) => item.comprado).length
  const porcentajeCompletado = totalItems > 0 ? (itemsComprados / totalItems) * 100 : 0
  const totalGastado = lista.items
    .filter((item) => item.comprado)
    .reduce((sum, item) => sum + (item.precioEstimado || 0), 0)

  // Calcular ahorro comparando con precio promedio de otros supermercados
  const ahorroEstimado = 0 // Simplificado por ahora

  return {
    totalItems,
    itemsComprados,
    porcentajeCompletado,
    totalGastado,
    ahorroEstimado,
  }
}
