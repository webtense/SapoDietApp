"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Check, Clock, Zap, AlertCircle, Pencil, X, Flame } from "lucide-react"
import type { MealPlan } from "@/lib/diet-calculator"
import { type MealTracking, analizarFotoComida } from "@/lib/tracking-system"

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
    reader.readAsDataURL(file)
  })
}

interface MealTrackingProps {
  mealPlan: MealPlan
  mealTracking: MealTracking[]
  onUpdateTracking: (tracking: MealTracking) => void
}

export function MealTrackingComponent({ mealPlan, mealTracking, onUpdateTracking }: MealTrackingProps) {
  const [fotoAnalisis, setFotoAnalisis] = useState<{
    analizando: boolean
    resultado: any
  }>({ analizando: false, resultado: null })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [comidaSeleccionada, setComidaSeleccionada] = useState<string | null>(null)
  const [mealUploadTarget, setMealUploadTarget] = useState<string | null>(null)

  // Estado para comida alternativa
  const [altOpen, setAltOpen]         = useState<string | null>(null)
  const [altDesc, setAltDesc]         = useState("")
  const [altCal, setAltCal]           = useState("")
  const [altGuardando, setAltGuardando] = useState(false)

  const meals = [
    { key: "desayuno", meal: mealPlan.desayuno, time: "08:00", icon: "🌅", nombre: "Desayuno" },
    { key: "mediaManana", meal: mealPlan.mediaManana, time: "10:30", icon: "🍎", nombre: "Media Mañana" },
    { key: "almuerzo", meal: mealPlan.almuerzo, time: "14:00", icon: "🍽️", nombre: "Almuerzo" },
    { key: "merienda", meal: mealPlan.merienda, time: "17:00", icon: "🥜", nombre: "Merienda" },
    { key: "cena", meal: mealPlan.cena, time: "20:30", icon: "🌙", nombre: "Cena" },
  ]

  const obtenerTracking = (tipoComida: string): MealTracking => {
    return (
      mealTracking.find((t) => t.tipoComida === tipoComida) || {
        id: tipoComida,
        fecha: new Date(),
        tipoComida: tipoComida as any,
        completado: false,
        cumpleConPlan: true,
      }
    )
  }

  const marcarComidaCompletada = (tipoComida: string) => {
    const tracking = obtenerTracking(tipoComida)
    const updatedTracking: MealTracking = {
      ...tracking,
      completado: !tracking.completado,
      horaConsumida: !tracking.completado ? new Date() : undefined,
    }
    onUpdateTracking(updatedTracking)
  }

  const manejarSubidaFoto = async (tipoComida: string, file: File) => {
    setComidaSeleccionada(tipoComida)
    setFotoAnalisis({ analizando: true, resultado: null })

    const fotoUrl = await fileToDataUrl(file)

    try {
      const resultado = await analizarFotoComida(fotoUrl)
      setFotoAnalisis({ analizando: false, resultado })

      const tracking = obtenerTracking(tipoComida)
      const updatedTracking: MealTracking = {
        ...tracking,
        fotoPlato: fotoUrl,
        caloriasReales: resultado.caloriasEstimadas,
        cumpleConPlan: resultado.cumpleConPlan,
        completado: true,
        horaConsumida: new Date(),
      }
      onUpdateTracking(updatedTracking)
    } catch (error) {
      setFotoAnalisis({ analizando: false, resultado: null })
    }
  }

  const guardarComidaAlternativa = async (tipoComida: string) => {
    if (!altDesc.trim()) return
    setAltGuardando(true)

    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "meal",
        payload: {
          dateIso: new Date().toISOString(),
          mealType: tipoComida,
          completed: true,
          caloriesActual: altCal ? Number(altCal) : undefined,
          notes: altDesc.trim(),
          followsPlan: false,
        },
      }),
    })

    onUpdateTracking({
      ...obtenerTracking(tipoComida),
      completado: true,
      cumpleConPlan: false,
      caloriasReales: altCal ? Number(altCal) : undefined,
      observaciones: altDesc.trim(),
      horaConsumida: new Date(),
    })

    setAltDesc("")
    setAltCal("")
    setAltOpen(null)
    setAltGuardando(false)
  }

  const comidasCompletadas = mealTracking.filter((t) => t.completado).length
  const totalComidas = meals.length
  const progresoComidas = (comidasCompletadas / totalComidas) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Seguimiento de Comidas
          </CardTitle>
          <CardDescription>Registra tus comidas y sube fotos para análisis automático</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Progreso del día</span>
              <span>
                {comidasCompletadas} de {totalComidas} comidas
              </span>
            </div>
            <Progress value={progresoComidas} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && mealUploadTarget) {
              manejarSubidaFoto(mealUploadTarget, file)
            }
            e.target.value = ""
          }}
        />

        {meals.map(({ key, meal, time, icon, nombre }) => {
          const tracking = obtenerTracking(key)

          return (
            <Card key={key} className={tracking.completado ? "bg-green-50 border-green-200" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="font-semibold">{nombre}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tracking.completado && tracking.cumpleConPlan === false ? (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        <Pencil className="h-3 w-3 mr-1" />
                        Alternativa
                      </Badge>
                    ) : tracking.completado ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    ) : null}
                    {tracking.fotoPlato && tracking.cumpleConPlan === false && !tracking.observaciones && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Revisar
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-sm">
                  <strong>{meal.nombre}</strong>
                  <div className="text-muted-foreground mt-1">
                    {meal.calorias} cal • P: {Math.round(meal.proteinas)}g • C: {Math.round(meal.carbohidratos)}g • G:{" "}
                    {Math.round(meal.grasas)}g
                  </div>
                </div>

                {tracking.fotoPlato && (
                  <div className="space-y-2">
                    <img
                      src={tracking.fotoPlato || "/placeholder.svg"}
                      alt="Foto del plato"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {tracking.caloriasReales && (
                      <div className="text-sm">
                        <span className="font-medium">Calorías detectadas: </span>
                        <span
                          className={tracking.caloriasReales > meal.calorias * 1.2 ? "text-red-600" : "text-green-600"}
                        >
                          {tracking.caloriasReales} cal
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {fotoAnalisis.analizando && comidaSeleccionada === key && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Analizando foto...
                  </div>
                )}

                {fotoAnalisis.resultado && comidaSeleccionada === key && (
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <div className="font-medium text-sm">Análisis de la foto:</div>
                    <div className="text-sm space-y-1">
                      <div>Ingredientes detectados: {fotoAnalisis.resultado.ingredientesDetectados.join(", ")}</div>
                      <div>Calorías estimadas: {fotoAnalisis.resultado.caloriasEstimadas}</div>
                      <div className="text-xs text-muted-foreground">
                        {fotoAnalisis.resultado.recomendaciones.join(". ")}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant={tracking.completado && tracking.cumpleConPlan !== false ? "secondary" : "default"}
                    size="sm"
                    onClick={() => marcarComidaCompletada(key)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {tracking.completado && tracking.cumpleConPlan !== false ? "Completado" : "Seguí el plan"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMealUploadTarget(key)
                      fileInputRef.current?.click()
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Foto
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAltOpen(altOpen === key ? null : key)
                      setAltDesc(tracking.observaciones ?? "")
                      setAltCal(tracking.caloriasReales ? String(tracking.caloriasReales) : "")
                    }}
                    title="Anotar lo que comí realmente"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                {/* Panel: comida alternativa */}
                {altOpen === key && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-orange-700">¿Comiste algo diferente?</span>
                      <button onClick={() => setAltOpen(null)} className="text-orange-400 hover:text-orange-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Textarea
                      placeholder="Ej: Bocadillo de jamón y patatas fritas en un bar…"
                      rows={2}
                      value={altDesc}
                      onChange={e => setAltDesc(e.target.value)}
                      className="resize-none rounded-lg text-sm bg-white border-orange-200 focus:border-orange-400"
                    />
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Flame className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-orange-400" />
                        <Input
                          type="number"
                          placeholder="Kcal aprox. (opcional)"
                          min={0}
                          max={3000}
                          value={altCal}
                          onChange={e => setAltCal(e.target.value)}
                          className="pl-7 rounded-lg text-sm bg-white border-orange-200"
                        />
                      </div>
                      <Button
                        size="sm"
                        disabled={!altDesc.trim() || altGuardando}
                        onClick={() => guardarComidaAlternativa(key)}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                      >
                        {altGuardando ? "…" : "Guardar"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Resumen comida alternativa ya guardada */}
                {tracking.completado && tracking.cumpleConPlan === false && tracking.observaciones && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                    <span className="font-semibold">🍴 Lo que comiste: </span>
                    {tracking.observaciones}
                    {tracking.caloriasReales && (
                      <span className="ml-2 text-xs text-orange-500">({tracking.caloriasReales} kcal)</span>
                    )}
                  </div>
                )}

                {tracking.observaciones && tracking.cumpleConPlan !== false && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Notas:</strong> {tracking.observaciones}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
