"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Heart, Target, Clock, ShoppingCart, Dumbbell, Activity, Utensils } from "lucide-react"
import { DietPlanDisplay } from "@/components/diet-plan-display"
import { ShoppingListDisplay } from "@/components/shopping-list-display"
import { MealTrackingComponent } from "@/components/meal-tracking"
import { ExerciseTrackingComponent } from "@/components/exercise-tracking"
import {
  calcularNecesidadesCaloricas,
  calcularMacronutrientes,
  generarPlanComidas,
  type NutritionalNeeds,
  type MealPlan,
} from "@/lib/diet-calculator"
import { generarListaCompra, type ShoppingList } from "@/lib/shopping-list-generator"
import { generarPlanEjercicios, type MealTracking, type ExerciseTracking, type Exercise } from "@/lib/tracking-system"

interface FormData {
  // Datos personales
  nombre: string
  edad: string
  altura: string
  peso: string
  complexion: string

  // Objetivos
  pesoMeta: string
  tiempoMeta: string

  // Preferencias alimentarias
  tipoDieta: string
  alimentosNoPermitidos: string

  // Horarios
  horaLevantarse: string
  horaAcostarse: string
  horaAlmorzar: string

  // Compras
  supermercado: string

  // Ejercicio
  frecuenciaEntrenamiento: string
  lugarEntrenamiento: string[]
  equipamiento: string[]
}

const supermercadosEspana = [
  "Mercadona",
  "Carrefour",
  "El Corte Inglés",
  "Alcampo",
  "Eroski",
  "Hipercor",
  "Lidl",
  "Aldi",
  "Dia",
  "Consum",
]

const tiposDieta = [
  "Mediterránea",
  "Vegetariana",
  "Vegana",
  "Keto",
  "Paleo",
  "Baja en carbohidratos",
  "Alta en proteínas",
  "Sin gluten",
  "Personalizada",
]

export default function ConfiguracionInicial() {
  const [paso, setPaso] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    edad: "",
    altura: "",
    peso: "",
    complexion: "",
    pesoMeta: "",
    tiempoMeta: "",
    tipoDieta: "",
    alimentosNoPermitidos: "",
    horaLevantarse: "",
    horaAcostarse: "",
    horaAlmorzar: "",
    supermercado: "",
    frecuenciaEntrenamiento: "",
    lugarEntrenamiento: [],
    equipamiento: [],
  })

  const [metaViable, setMetaViable] = useState<boolean | null>(null)
  const [planGenerado, setPlanGenerado] = useState(false)
  const [mostrarListaCompra, setMostrarListaCompra] = useState(false)
  const [mostrarSeguimiento, setMostrarSeguimiento] = useState(false)
  const [tipoSeguimiento, setTipoSeguimiento] = useState<"comidas" | "ejercicios">("comidas")

  const [planNutricional, setPlanNutricional] = useState<{
    necesidades: NutritionalNeeds
    planComidas: MealPlan
  } | null>(null)
  const [listaCompra, setListaCompra] = useState<ShoppingList | null>(null)
  const [planEjercicios, setPlanEjercicios] = useState<Exercise[]>([])
  const [seguimientoComidas, setSeguimientoComidas] = useState<MealTracking[]>([])
  const [seguimientoEjercicios, setSeguimientoEjercicios] = useState<ExerciseTracking[]>([])

  const actualizarFormData = (campo: keyof FormData, valor: any) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }))
  }

  const calcularViabilidadMeta = () => {
    const pesoActual = Number.parseFloat(formData.peso)
    const pesoObjetivo = Number.parseFloat(formData.pesoMeta)
    const tiempoSemanas = Number.parseInt(formData.tiempoMeta)

    if (pesoActual && pesoObjetivo && tiempoSemanas) {
      const diferenciaPeso = Math.abs(pesoActual - pesoObjetivo)
      const pesoSemana = diferenciaPeso / tiempoSemanas

      // Consideramos viable perder/ganar máximo 0.5-1kg por semana
      const viable = pesoSemana <= 1
      setMetaViable(viable)
    }
  }

  const siguientePaso = () => {
    if (paso === 2) {
      calcularViabilidadMeta()
    }
    setPaso((prev) => prev + 1)
  }

  const pasoAnterior = () => {
    setPaso((prev) => prev - 1)
  }

  const manejarLugarEntrenamiento = (lugar: string, checked: boolean) => {
    if (checked) {
      actualizarFormData("lugarEntrenamiento", [...formData.lugarEntrenamiento, lugar])
    } else {
      actualizarFormData(
        "lugarEntrenamiento",
        formData.lugarEntrenamiento.filter((l) => l !== lugar),
      )
    }
  }

  const manejarEquipamiento = (equipo: string, checked: boolean) => {
    if (checked) {
      actualizarFormData("equipamiento", [...formData.equipamiento, equipo])
    } else {
      actualizarFormData(
        "equipamiento",
        formData.equipamiento.filter((e) => e !== equipo),
      )
    }
  }

  const finalizarConfiguracion = () => {
    console.log("Configuración completa:", formData)

    const pesoActual = Number.parseFloat(formData.peso)
    const pesoMeta = Number.parseFloat(formData.pesoMeta)
    const altura = Number.parseFloat(formData.altura)
    const edad = Number.parseInt(formData.edad)

    // Determinar objetivo basado en peso actual vs meta
    let objetivo: "perder" | "mantener" | "ganar" = "mantener"
    if (pesoMeta < pesoActual) objetivo = "perder"
    else if (pesoMeta > pesoActual) objetivo = "ganar"

    // Asumir sexo femenino por defecto (se podría añadir al formulario)
    const sexo: "hombre" | "mujer" = "mujer"

    // Calcular necesidades calóricas
    const calorias = calcularNecesidadesCaloricas(
      pesoActual,
      altura,
      edad,
      sexo,
      formData.frecuenciaEntrenamiento,
      objetivo,
    )

    // Calcular macronutrientes
    const necesidades = calcularMacronutrientes(calorias, formData.tipoDieta)

    // Generar plan de comidas
    const alimentosNoPermitidos = formData.alimentosNoPermitidos
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0)

    const planComidas = generarPlanComidas(
      necesidades,
      formData.tipoDieta,
      alimentosNoPermitidos,
      formData.horaAlmorzar,
    )

    const ejercicios = generarPlanEjercicios(
      formData.frecuenciaEntrenamiento,
      formData.lugarEntrenamiento,
      formData.equipamiento,
      "principiante",
    )

    setPlanNutricional({ necesidades, planComidas })
    setPlanEjercicios(ejercicios)
    setPlanGenerado(true)
  }

  const generarListaCompraHandler = () => {
    if (planNutricional) {
      const lista = generarListaCompra(
        planNutricional.planComidas,
        formData.supermercado || "Mercadona",
        7, // 7 días
      )
      setListaCompra(lista)
      setMostrarListaCompra(true)
    }
  }

  const manejarToggleItem = (index: number) => {
    if (listaCompra) {
      const nuevaLista = { ...listaCompra }
      nuevaLista.items[index].comprado = !nuevaLista.items[index].comprado
      setListaCompra(nuevaLista)
    }
  }

  const mostrarSeguimientoHandler = (tipo: "comidas" | "ejercicios") => {
    setTipoSeguimiento(tipo)
    setMostrarSeguimiento(true)
  }

  const actualizarSeguimientoComida = (tracking: MealTracking) => {
    setSeguimientoComidas((prev) => {
      const index = prev.findIndex((t) => t.tipoComida === tracking.tipoComida)
      if (index >= 0) {
        const nuevo = [...prev]
        nuevo[index] = tracking
        return nuevo
      } else {
        return [...prev, tracking]
      }
    })
  }

  const actualizarSeguimientoEjercicio = (tracking: ExerciseTracking) => {
    setSeguimientoEjercicios((prev) => {
      const index = prev.findIndex((t) => t.ejercicio === tracking.ejercicio)
      if (index >= 0) {
        const nuevo = [...prev]
        nuevo[index] = tracking
        return nuevo
      } else {
        return [...prev, tracking]
      }
    })
  }

  if (mostrarSeguimiento && planNutricional) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">Seguimiento Diario</h2>
            <p className="text-muted-foreground">Registra tu progreso y mantén el control de tu plan</p>
          </div>

          <div className="flex gap-2 mb-6 justify-center">
            <Button
              variant={tipoSeguimiento === "comidas" ? "default" : "outline"}
              onClick={() => setTipoSeguimiento("comidas")}
            >
              <Utensils className="h-4 w-4 mr-2" />
              Comidas
            </Button>
            <Button
              variant={tipoSeguimiento === "ejercicios" ? "default" : "outline"}
              onClick={() => setTipoSeguimiento("ejercicios")}
            >
              <Activity className="h-4 w-4 mr-2" />
              Ejercicios
            </Button>
          </div>

          {tipoSeguimiento === "comidas" && (
            <MealTrackingComponent
              mealPlan={planNutricional.planComidas}
              mealTracking={seguimientoComidas}
              onUpdateTracking={actualizarSeguimientoComida}
            />
          )}

          {tipoSeguimiento === "ejercicios" && (
            <ExerciseTrackingComponent
              exercises={planEjercicios}
              exerciseTracking={seguimientoEjercicios}
              onUpdateTracking={actualizarSeguimientoEjercicio}
            />
          )}

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => setMostrarSeguimiento(false)}>
              Volver al Plan Nutricional
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (mostrarListaCompra && listaCompra) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <ShoppingListDisplay
            shoppingList={listaCompra}
            onItemToggle={manejarToggleItem}
            onGenerateNew={() => {
              setMostrarListaCompra(false)
              setListaCompra(null)
            }}
          />

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => setMostrarListaCompra(false)}>
              Volver al Plan Nutricional
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (planGenerado && planNutricional) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <DietPlanDisplay
            mealPlan={planNutricional.planComidas}
            nutritionalNeeds={planNutricional.necesidades}
            userName={formData.nombre}
          />

          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Button onClick={generarListaCompraHandler} className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Generar Lista de Compra
            </Button>
            <Button
              onClick={() => mostrarSeguimientoHandler("comidas")}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Utensils className="h-4 w-4" />
              Seguir Comidas
            </Button>
            <Button
              onClick={() => mostrarSeguimientoHandler("ejercicios")}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Seguir Ejercicios
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPlanGenerado(false)
                setPlanNutricional(null)
                setPaso(1)
              }}
            >
              Modificar Configuración
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">DietApp Familia Sapo</h1>
          <p className="text-muted-foreground text-lg">Tu compañero integral para una vida saludable</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Paso {paso} de 5</span>
            <Badge variant="secondary">{Math.round((paso / 5) * 100)}% completado</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(paso / 5) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {paso === 1 && <Heart className="h-5 w-5 text-primary" />}
              {paso === 2 && <Target className="h-5 w-5 text-primary" />}
              {paso === 3 && <Clock className="h-5 w-5 text-primary" />}
              {paso === 4 && <ShoppingCart className="h-5 w-5 text-primary" />}
              {paso === 5 && <Dumbbell className="h-5 w-5 text-primary" />}

              {paso === 1 && "Datos Personales"}
              {paso === 2 && "Objetivos de Salud"}
              {paso === 3 && "Horarios y Rutina"}
              {paso === 4 && "Preferencias Alimentarias"}
              {paso === 5 && "Actividad Física"}
            </CardTitle>
            <CardDescription>
              {paso === 1 && "Cuéntanos sobre ti para personalizar tu experiencia"}
              {paso === 2 && "Define tus metas y objetivos de peso"}
              {paso === 3 && "Establece tus horarios diarios"}
              {paso === 4 && "Selecciona tus preferencias de dieta y compras"}
              {paso === 5 && "Configura tu rutina de ejercicios"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {paso === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => actualizarFormData("nombre", e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="edad">Edad</Label>
                  <Input
                    id="edad"
                    type="number"
                    value={formData.edad}
                    onChange={(e) => actualizarFormData("edad", e.target.value)}
                    placeholder="Años"
                  />
                </div>
                <div>
                  <Label htmlFor="altura">Altura (cm)</Label>
                  <Input
                    id="altura"
                    type="number"
                    value={formData.altura}
                    onChange={(e) => actualizarFormData("altura", e.target.value)}
                    placeholder="170"
                  />
                </div>
                <div>
                  <Label htmlFor="peso">Peso actual (kg)</Label>
                  <Input
                    id="peso"
                    type="number"
                    value={formData.peso}
                    onChange={(e) => actualizarFormData("peso", e.target.value)}
                    placeholder="70"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="complexion">Complexión</Label>
                  <Select
                    value={formData.complexion}
                    onValueChange={(value) => actualizarFormData("complexion", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu complexión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delgada">Delgada</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="robusta">Robusta</SelectItem>
                      <SelectItem value="atletica">Atlética</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {paso === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pesoMeta">Peso objetivo (kg)</Label>
                    <Input
                      id="pesoMeta"
                      type="number"
                      value={formData.pesoMeta}
                      onChange={(e) => actualizarFormData("pesoMeta", e.target.value)}
                      placeholder="65"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tiempoMeta">Tiempo para alcanzar la meta (semanas)</Label>
                    <Input
                      id="tiempoMeta"
                      type="number"
                      value={formData.tiempoMeta}
                      onChange={(e) => actualizarFormData("tiempoMeta", e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>

                {metaViable !== null && (
                  <div
                    className={`p-4 rounded-lg ${metaViable ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                  >
                    <p className={`font-medium ${metaViable ? "text-green-800" : "text-red-800"}`}>
                      {metaViable
                        ? "¡Excelente! Tu meta es realista y saludable."
                        : "Tu meta es muy ambiciosa. Te recomendamos un enfoque más gradual para mejores resultados."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {paso === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="horaLevantarse">Hora de levantarse</Label>
                  <Input
                    id="horaLevantarse"
                    type="time"
                    value={formData.horaLevantarse}
                    onChange={(e) => actualizarFormData("horaLevantarse", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="horaAlmorzar">Hora de almorzar</Label>
                  <Input
                    id="horaAlmorzar"
                    type="time"
                    value={formData.horaAlmorzar}
                    onChange={(e) => actualizarFormData("horaAlmorzar", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="horaAcostarse">Hora de acostarse</Label>
                  <Input
                    id="horaAcostarse"
                    type="time"
                    value={formData.horaAcostarse}
                    onChange={(e) => actualizarFormData("horaAcostarse", e.target.value)}
                  />
                </div>
              </div>
            )}

            {paso === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tipoDieta">Tipo de dieta preferida</Label>
                  <Select value={formData.tipoDieta} onValueChange={(value) => actualizarFormData("tipoDieta", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu tipo de dieta" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDieta.map((dieta) => (
                        <SelectItem key={dieta} value={dieta}>
                          {dieta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supermercado">Supermercado habitual</Label>
                  <Select
                    value={formData.supermercado}
                    onValueChange={(value) => actualizarFormData("supermercado", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="¿Dónde sueles comprar?" />
                    </SelectTrigger>
                    <SelectContent>
                      {supermercadosEspana.map((super_) => (
                        <SelectItem key={super_} value={super_}>
                          {super_}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="alimentosNoPermitidos">Alimentos que no puedes comer o no te gustan</Label>
                  <Textarea
                    id="alimentosNoPermitidos"
                    value={formData.alimentosNoPermitidos}
                    onChange={(e) => actualizarFormData("alimentosNoPermitidos", e.target.value)}
                    placeholder="Ej: frutos secos, mariscos, lácteos..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {paso === 5 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="frecuenciaEntrenamiento">¿Cuántas veces quieres entrenar por semana?</Label>
                  <Select
                    value={formData.frecuenciaEntrenamiento}
                    onValueChange={(value) => actualizarFormData("frecuenciaEntrenamiento", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 veces por semana</SelectItem>
                      <SelectItem value="3-4">3-4 veces por semana</SelectItem>
                      <SelectItem value="5-6">5-6 veces por semana</SelectItem>
                      <SelectItem value="diario">Todos los días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>¿Dónde prefieres entrenar?</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {["Casa", "Gimnasio", "Parque/Exterior"].map((lugar) => (
                      <div key={lugar} className="flex items-center space-x-2">
                        <Checkbox
                          id={lugar}
                          checked={formData.lugarEntrenamiento.includes(lugar)}
                          onCheckedChange={(checked) => manejarLugarEntrenamiento(lugar, checked as boolean)}
                        />
                        <Label htmlFor={lugar}>{lugar}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.lugarEntrenamiento.includes("Casa") && (
                  <div>
                    <Label>¿Qué equipamiento tienes en casa?</Label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {["Pesas", "Gomas elásticas", "Esterilla", "Mancuernas", "Ninguno"].map((equipo) => (
                        <div key={equipo} className="flex items-center space-x-2">
                          <Checkbox
                            id={equipo}
                            checked={formData.equipamiento.includes(equipo)}
                            onCheckedChange={(checked) => manejarEquipamiento(equipo, checked as boolean)}
                          />
                          <Label htmlFor={equipo}>{equipo}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-6">
              {paso > 1 && (
                <Button variant="outline" onClick={pasoAnterior}>
                  Anterior
                </Button>
              )}

              {paso < 5 ? (
                <Button onClick={siguientePaso} className="ml-auto">
                  Siguiente
                </Button>
              ) : (
                <Button onClick={finalizarConfiguracion} className="ml-auto">
                  Finalizar Configuración
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
