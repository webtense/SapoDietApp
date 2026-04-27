export const SUPPLEMENTS_KEY = "sapofit-supplements-brand"

export type MealMoment =
  | "al-despertar"
  | "antes-desayuno"
  | "con-desayuno"
  | "media-manana"
  | "antes-entreno"
  | "despues-entreno"
  | "antes-comida"
  | "con-comida"
  | "merienda"
  | "antes-cena"
  | "con-cena"
  | "antes-dormir"

export const MOMENT_LABELS: Record<MealMoment, string> = {
  "al-despertar": "Al despertar",
  "antes-desayuno": "Antes del desayuno",
  "con-desayuno": "Con el desayuno",
  "media-manana": "Media mañana",
  "antes-entreno": "Antes del entreno",
  "despues-entreno": "Después del entreno",
  "antes-comida": "Antes de la comida",
  "con-comida": "Con la comida",
  "merienda": "Merienda",
  "antes-cena": "Antes de la cena",
  "con-cena": "Con la cena",
  "antes-dormir": "Antes de dormir",
}

export interface SupplementDose {
  moment: MealMoment
  amount: string
  instruction: string
}

export interface SupplementProduct {
  id: string
  name: string
  benefit: string
  doses: SupplementDose[]
  tip?: string
}

export interface SupplementBrand {
  id: string
  name: string
  tagline: string
  color: string
  focus: string
  products: SupplementProduct[]
}

export const SUPPLEMENT_BRANDS: SupplementBrand[] = [
  {
    id: "herbalife",
    name: "Herbalife",
    tagline: "Nutrición celular avanzada",
    color: "orange",
    focus: "Sustitución de comidas + nutrición celular",
    products: [
      {
        id: "herbalife-f1",
        name: "Fórmula 1 (batido)",
        benefit: "Sustituto de comida con proteínas, vitaminas y minerales",
        doses: [
          {
            moment: "con-desayuno",
            amount: "2 medidas (26 g)",
            instruction: "Mezcla 2 medidas rasas con 250 ml de leche desnatada o bebida vegetal. Agita o bate hasta que no queden grumos. Sustituye el desayuno completo.",
          },
          {
            moment: "merienda",
            amount: "2 medidas (26 g)",
            instruction: "Prepara igual que el desayuno. Puedes añadir fruta fresca o hielo picado para mayor saciedad. Sustituye la merienda.",
          },
        ],
        tip: "Para perder peso, usa el batido en las 2 tomas y haz 1 comida normal equilibrada al mediodía.",
      },
      {
        id: "herbalife-aloe",
        name: "Concentrado de Aloe",
        benefit: "Prepara el sistema digestivo y mejora la absorción de nutrientes",
        doses: [
          {
            moment: "antes-desayuno",
            amount: "30 ml",
            instruction: "Diluye 30 ml en 250 ml de agua fría. Bébelo 10-15 minutos antes del batido matutino para preparar el sistema digestivo.",
          },
          {
            moment: "antes-comida",
            amount: "30 ml",
            instruction: "Repite la misma preparación antes de la comida principal del día.",
          },
        ],
      },
      {
        id: "herbalife-te",
        name: "Té Concentrado de Hierbas",
        benefit: "Activa el metabolismo y proporciona energía sin azúcar",
        doses: [
          {
            moment: "al-despertar",
            amount: "½ medida (1,7 g)",
            instruction: "Disuelve ½ medida en 240 ml de agua caliente o fría. Puedes mezclar sabores. Tómalo nada más levantarte, antes del aloe y del batido.",
          },
          {
            moment: "antes-entreno",
            amount: "½ medida (1,7 g)",
            instruction: "Prepara igual en agua fría con hielo. Tómalo 20 minutos antes del entrenamiento para potenciar el rendimiento.",
          },
        ],
      },
      {
        id: "herbalife-f2",
        name: "Fórmula 2 (multivitamínico)",
        benefit: "Cubre las necesidades de 21 vitaminas y minerales esenciales",
        doses: [
          {
            moment: "con-desayuno",
            amount: "1 comprimido",
            instruction: "Toma 1 comprimido durante el desayuno o junto al batido. Tomar con comida mejora la absorción de las vitaminas liposolubles.",
          },
          {
            moment: "con-comida",
            amount: "1 comprimido",
            instruction: "Segundo comprimido durante la comida principal.",
          },
          {
            moment: "con-cena",
            amount: "1 comprimido",
            instruction: "Tercer comprimido durante la cena. Completa la dosis diaria de 3 comprimidos.",
          },
        ],
      },
      {
        id: "herbalife-f3",
        name: "Fórmula 3 (proteína en polvo)",
        benefit: "Proteína extra sin sabor para añadir al batido o a recetas",
        doses: [
          {
            moment: "con-desayuno",
            amount: "1-3 cucharaditas (5-15 g)",
            instruction: "Añade directamente al batido F1 antes de batir. No tiene sabor propio, no altera el gusto. Ideal si tu objetivo es aumentar masa muscular.",
          },
          {
            moment: "despues-entreno",
            amount: "2-3 cucharaditas (10-15 g)",
            instruction: "Mezcla con agua o añade al batido post-entreno. La ventana anabólica dura 30-45 minutos tras el ejercicio.",
          },
        ],
      },
    ],
  },
  {
    id: "optimum-nutrition",
    name: "Optimum Nutrition",
    tagline: "Gold Standard en rendimiento deportivo",
    color: "blue",
    focus: "Proteína de alta calidad + rendimiento",
    products: [
      {
        id: "on-whey",
        name: "Gold Standard 100% Whey",
        benefit: "Proteína de suero de alta absorción para recuperación muscular",
        doses: [
          {
            moment: "despues-entreno",
            amount: "1 scoop (30 g)",
            instruction: "Mezcla 1 scoop con 180-240 ml de agua fría en una coctelera. Tómalo en los primeros 30 minutos post-entreno para maximizar la síntesis proteica.",
          },
          {
            moment: "antes-dormir",
            amount: "1 scoop (30 g)",
            instruction: "Mezcla con 240 ml de leche para ralentizar la absorción. Contribuye a la recuperación muscular nocturna.",
          },
        ],
        tip: "Si no entrenas ese día, úsalo como snack entre comidas para alcanzar tus objetivos de proteína.",
      },
      {
        id: "on-creatina",
        name: "Creatina Monohidrato",
        benefit: "Aumenta la fuerza, potencia y rendimiento en ejercicios de alta intensidad",
        doses: [
          {
            moment: "despues-entreno",
            amount: "5 g (1 cucharadita)",
            instruction: "Disuelve 5 g en agua, zumo o añade al batido de proteína post-entreno. En días sin entreno, tómala por la mañana con el desayuno. La consistencia diaria es lo más importante.",
          },
        ],
        tip: "No necesitas fase de carga. 3-5 g diarios de forma consistente da los mismos resultados a largo plazo.",
      },
      {
        id: "on-multivit",
        name: "Opti-Men / Opti-Women",
        benefit: "Multivitamínico deportivo con 75+ ingredientes activos",
        doses: [
          {
            moment: "con-desayuno",
            amount: "1 comprimido",
            instruction: "Toma 1 comprimido con el desayuno. El complejo vitamínico se absorbe mejor acompañado de alimentos con grasa.",
          },
          {
            moment: "con-comida",
            amount: "1 comprimido",
            instruction: "Segundo comprimido durante la comida del mediodía.",
          },
          {
            moment: "con-cena",
            amount: "1 comprimido",
            instruction: "Tercer comprimido con la cena. La dosis de 3 comprimidos/día es la recomendada para actividad física regular.",
          },
        ],
      },
      {
        id: "on-omega3",
        name: "Fish Oil (Omega-3)",
        benefit: "Reduce inflamación, mejora la recuperación y la salud cardiovascular",
        doses: [
          {
            moment: "con-comida",
            amount: "2 cápsulas blandas",
            instruction: "Toma 2 cápsulas durante la comida más grande del día. Tomarlas con comida reduce el posible reflujo y mejora la absorción de los ácidos grasos EPA/DHA.",
          },
        ],
      },
    ],
  },
  {
    id: "myprotein",
    name: "Myprotein",
    tagline: "Suplementación accesible y de calidad",
    color: "green",
    focus: "Relación calidad-precio, amplia gama",
    products: [
      {
        id: "mp-whey",
        name: "Impact Whey Protein",
        benefit: "Proteína de suero con 21 g por serving, 82 sabores disponibles",
        doses: [
          {
            moment: "despues-entreno",
            amount: "1 scoop (25 g)",
            instruction: "Mezcla 1 scoop con 200-250 ml de agua en coctelera. Consume en los 45 minutos posteriores al entrenamiento.",
          },
          {
            moment: "media-manana",
            amount: "1 scoop (25 g)",
            instruction: "En días sin entreno, úsala como snack entre desayuno y comida para alcanzar tu objetivo proteico diario.",
          },
        ],
      },
      {
        id: "mp-creatina",
        name: "Creatina Monohidrato",
        benefit: "Creatina pura micronizada, sin aditivos",
        doses: [
          {
            moment: "despues-entreno",
            amount: "3-5 g",
            instruction: "Disuelve en agua o añade al batido de proteína. El momento exacto importa menos que la consistencia diaria: tómala siempre a la misma hora.",
          },
        ],
      },
      {
        id: "mp-pre",
        name: "THE Pre-Workout",
        benefit: "Energía y foco para el entrenamiento, con cafeína y beta-alanina",
        doses: [
          {
            moment: "antes-entreno",
            amount: "1 scoop (7,4 g)",
            instruction: "Mezcla 1 scoop con 200 ml de agua y tómalo 20-30 minutos antes del entrenamiento. No lo tomes después de las 17:00 si tienes sensibilidad a la cafeína.",
          },
        ],
        tip: "Empieza con media dosis para evaluar tu tolerancia a la cafeína (200 mg por scoop completo).",
      },
      {
        id: "mp-bcaa",
        name: "BCAA 4:1:1",
        benefit: "Aminoácidos de cadena ramificada para reducir el catabolismo muscular",
        doses: [
          {
            moment: "antes-entreno",
            amount: "1 scoop (7 g)",
            instruction: "Mezcla con 400 ml de agua y ve bebiendo durante el calentamiento. En entrenos en ayunas es especialmente útil para proteger el músculo.",
          },
          {
            moment: "despues-entreno",
            amount: "1 scoop (7 g)",
            instruction: "Segunda toma post-entreno junto o inmediatamente después del batido de proteína.",
          },
        ],
      },
    ],
  },
  {
    id: "hsn",
    name: "HSN Sports",
    tagline: "Marca española de referencia en nutrición deportiva",
    color: "purple",
    focus: "Calidad farmacéutica, producción nacional",
    products: [
      {
        id: "hsn-whey",
        name: "EvoWhey Protein 2.0",
        benefit: "Whey concentrado + aislado español con 78% de proteína",
        doses: [
          {
            moment: "despues-entreno",
            amount: "1 scoop (30 g)",
            instruction: "Mezcla con 250 ml de agua fría o leche. Consume en los 30 minutos post-entreno. La combinación con aislado garantiza rápida absorción.",
          },
        ],
      },
      {
        id: "hsn-creatina",
        name: "Creatina Monohidrato Evocreatine",
        benefit: "Creatina 200 mesh micronizada de máxima pureza",
        doses: [
          {
            moment: "con-desayuno",
            amount: "3 g",
            instruction: "Disuelve 3 g en el zumo del desayuno o en agua. Tomar con carbohidratos simples (zumo de naranja) potencia la absorción muscular de la creatina.",
          },
        ],
      },
      {
        id: "hsn-lcarnitina",
        name: "L-Carnitina Liquida",
        benefit: "Facilita el transporte de ácidos grasos a la mitocondria para usarlos como energía",
        doses: [
          {
            moment: "antes-entreno",
            amount: "2 g (2 ml)",
            instruction: "Toma 2 ml directamente o disuelto en agua 30 minutos antes del entrenamiento. Más efectiva con entrenamiento de larga duración o cardio en ayunas.",
          },
          {
            moment: "antes-desayuno",
            amount: "2 g (2 ml)",
            instruction: "En días sin entreno, tómala por la mañana en ayunas o antes del desayuno para aprovechar el estado metabólico post-nocturno.",
          },
        ],
        tip: "Combínala con 200 mg de cafeína para potenciar el efecto lipolítico.",
      },
      {
        id: "hsn-multivit",
        name: "Evoadvanced Multivit Sport",
        benefit: "Multivitamínico específico para deportistas con adaptógenos",
        doses: [
          {
            moment: "con-desayuno",
            amount: "2 cápsulas",
            instruction: "Toma 2 cápsulas con el desayuno. Contiene Rhodiola Rosea y Zinc que contribuyen al rendimiento mental y físico durante el entrenamiento.",
          },
        ],
      },
    ],
  },
  {
    id: "forever-living",
    name: "Forever Living",
    tagline: "Nutrición basada en Aloe Vera puro",
    color: "teal",
    focus: "Aloe Vera certificado + bienestar integral",
    products: [
      {
        id: "fl-aloe-gel",
        name: "Forever Aloe Vera Gel",
        benefit: "Aloe vera puro al 99,7% para digestión, absorción y sistema inmune",
        doses: [
          {
            moment: "antes-desayuno",
            amount: "60-120 ml",
            instruction: "Agita bien el tetrabrik antes de servir. Bebe 60-120 ml directamente o mezclado con zumo de naranja natural. Espera 15-20 minutos antes de desayunar para que actúe sobre la mucosa digestiva.",
          },
          {
            moment: "antes-cena",
            amount: "60 ml",
            instruction: "Segunda toma de 60 ml antes de la cena. Muchos distribuidores recomiendan 3 tomas diarias; ajusta según tu tolerancia inicial.",
          },
        ],
        tip: "Los primeros días puedes sentir ligera aceleración del tránsito intestinal. Es normal y suele regularse en 1 semana.",
      },
      {
        id: "fl-therm",
        name: "Forever Therm",
        benefit: "Activa el metabolismo con guaraná, té verde y vitaminas del grupo B",
        doses: [
          {
            moment: "antes-desayuno",
            amount: "1 comprimido",
            instruction: "Toma 1 comprimido 30 minutos antes del desayuno con un vaso grande de agua. No tomar después de las 15:00 para no afectar el sueño.",
          },
          {
            moment: "antes-comida",
            amount: "1 comprimido",
            instruction: "Segundo comprimido 30 minutos antes de la comida del mediodía. Dosis máxima: 2 comprimidos diarios.",
          },
        ],
        tip: "No combinar con otros estimulantes. Si tienes sensibilidad a la cafeína, empieza con ½ comprimido.",
      },
      {
        id: "fl-lite-ultra",
        name: "Forever Lite Ultra",
        benefit: "Batido sustituto de comida con 18 g de proteína y aminoácidos esenciales",
        doses: [
          {
            moment: "con-desayuno",
            amount: "2 medidas (32 g)",
            instruction: "Bate 2 medidas con 250 ml de leche desnatada o bebida de almendras. Puedes añadir fruta fresca. Sustituye completamente el desayuno.",
          },
        ],
      },
      {
        id: "fl-active-probiotic",
        name: "Forever Active Probiotic",
        benefit: "6 cepas probióticas para equilibrar la microbiota intestinal",
        doses: [
          {
            moment: "antes-desayuno",
            amount: "1 perla",
            instruction: "Toma 1 perla en ayunas, justo antes o con el aloe vera gel. La cubierta entérica la protege del ácido gástrico hasta llegar al intestino.",
          },
        ],
      },
    ],
  },
  {
    id: "naturhouse",
    name: "Naturhouse",
    tagline: "Fitoterapia + dieta personalizada",
    color: "emerald",
    focus: "Plantas medicinales y control de peso natural",
    products: [
      {
        id: "nh-drenante",
        name: "Drenante Forte",
        benefit: "Elimina la retención de líquidos con cola de caballo, abedul y diente de león",
        doses: [
          {
            moment: "antes-desayuno",
            amount: "1 vial (15 ml)",
            instruction: "Agita el vial, ábrelo y dilúyelo en un vaso grande de agua (250 ml). Tómalo en ayunas por la mañana. Bebe mínimo 1,5 L de agua adicional durante el día para potenciar el efecto drenante.",
          },
          {
            moment: "antes-comida",
            amount: "1 vial (15 ml)",
            instruction: "Segunda toma antes de la comida principal diluido en agua. No superar 2 viales diarios.",
          },
        ],
        tip: "El efecto drenante es más notorio las primeras 2 semanas. Complementa con dieta baja en sal para mejores resultados.",
      },
      {
        id: "nh-quemagrasas",
        name: "Quemagrasa Activo",
        benefit: "Acelera el metabolismo con carnitina, guaraná y pimienta de cayena",
        doses: [
          {
            moment: "con-desayuno",
            amount: "1 cápsula",
            instruction: "Toma 1 cápsula con el desayuno acompañada de agua abundante. El guaraná proporciona energía sostenida durante la mañana.",
          },
          {
            moment: "antes-entreno",
            amount: "1 cápsula",
            instruction: "Segunda cápsula 30 minutos antes del ejercicio para potenciar la oxidación de grasas durante el entrenamiento.",
          },
        ],
      },
      {
        id: "nh-saciante",
        name: "Saciante Max",
        benefit: "Glucomanano y fibras naturales que reducen el apetito y ralentizan la absorción de azúcares",
        doses: [
          {
            moment: "antes-comida",
            amount: "2 cápsulas",
            instruction: "Toma 2 cápsulas con un vaso grande de agua (300 ml) 30 minutos antes de comer. El glucomanano se hincha en el estómago creando sensación de saciedad. Es esencial beber suficiente agua.",
          },
          {
            moment: "antes-cena",
            amount: "2 cápsulas",
            instruction: "Segunda toma 30 minutos antes de la cena, siempre con abundante agua. Ayuda a controlar el apetito nocturno.",
          },
        ],
        tip: "Sin agua suficiente puede producir sensación de atasco en el esófago. Siempre con mínimo 250 ml.",
      },
      {
        id: "nh-infusion",
        name: "Infusión NaturSlim",
        benefit: "Mezcla de plantas depurativas: cola de caballo, hinojo, ortiga y sen",
        doses: [
          {
            moment: "despues-entreno",
            amount: "1 sobre",
            instruction: "Infusiona 1 sobre en 200 ml de agua a 90°C durante 5 minutos. No endulzar o usar edulcorante sin calorías. El sen tiene efecto laxante suave: no tomar más de 1 por día ni más de 7 días seguidos.",
          },
        ],
      },
    ],
  },
]

export function getBrand(id: string): SupplementBrand | undefined {
  return SUPPLEMENT_BRANDS.find((b) => b.id === id)
}

export function getTodayProtocol(brand: SupplementBrand): Array<{
  moment: MealMoment
  label: string
  items: Array<{ productName: string; amount: string; instruction: string }>
}> {
  const byMoment = new Map<MealMoment, Array<{ productName: string; amount: string; instruction: string }>>()

  for (const product of brand.products) {
    for (const dose of product.doses) {
      if (!byMoment.has(dose.moment)) byMoment.set(dose.moment, [])
      byMoment.get(dose.moment)!.push({
        productName: product.name,
        amount: dose.amount,
        instruction: dose.instruction,
      })
    }
  }

  const order: MealMoment[] = [
    "al-despertar", "antes-desayuno", "con-desayuno", "media-manana",
    "antes-entreno", "despues-entreno", "antes-comida", "con-comida",
    "merienda", "antes-cena", "con-cena", "antes-dormir",
  ]

  return order
    .filter((m) => byMoment.has(m))
    .map((m) => ({ moment: m, label: MOMENT_LABELS[m], items: byMoment.get(m)! }))
}
