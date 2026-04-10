"use client"

import { useEffect, useState } from "react"
import { Droplets, Scale, Battery, Smile, CheckCircle2, Circle, Clock, Utensils, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface NutritionalNeeds {
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
}

interface MealPlan {
  [key: string]: { main: string; side: string; dessert?: string; calories: number }[]
}

interface MealTracking {
  id: string
  tipoComida: string
  completado: boolean
  horaConsumida?: string
  observaciones?: string
}

interface ExerciseTracking {
  id: string
  ejercicio: string
  completado: boolean
  duracionTotal?: number
}

export default function HoyPage() {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<{ necesidades: NutritionalNeeds; planComidas: MealPlan } | null>(null)
  const [mealTracking, setMealTracking] = useState<MealTracking[]>([])
  const [exerciseTracking, setExerciseTracking] = useState<ExerciseTracking[]>([])
  const [checkin, setCheckin] = useState({ water: "", weight: "", energy: 3, mood: 3 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [planRes, trackingRes] = await Promise.all([
        fetch("/api/plan"),
        fetch("/api/tracking"),
      ])

      if (planRes.ok) {
        const p = await planRes.json()
        if (p.plan?.planJson) {
          const parsed = JSON.parse(p.plan.planJson)
          setPlan({ necesidades: parsed.macros, planComidas: parsed.mealPlan })
        }
      }

      if (trackingRes.ok) {
        const t = await trackingRes.json()
        if (t.mealLogs) {
          setMealTracking(t.mealLogs.map((m: any) => ({
            id: m.id,
            tipoComida: m.mealType,
            completado: m.completed,
            horaConsumida: m.consumedAt,
            observaciones: m.notes,
          })))
        }
        if (t.exerciseLogs) {
          setExerciseTracking(t.exerciseLogs.map((e: any) => ({
            id: e.id,
            ejercicio: e.exerciseId,
            completado: e.completed,
            duracionTotal: e.durationSec,
          })))
        }
        if (t.dailyLog) {
          setCheckin({
            water: t.dailyLog.waterLiters ? String(t.dailyLog.waterLiters) : "",
            weight: t.dailyLog.weightKg ? String(t.dailyLog.weightKg) : "",
            energy: t.dailyLog.energy || 3,
            mood: t.dailyLog.mood || 3,
          })
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const guardarCheckin = async () => {
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "daily",
        payload: {
          dateIso: new Date().toISOString(),
          caloriesTarget: plan?.necesidades.calories || 2000,
          waterLiters: Number(checkin.water || 0),
          waterTarget: plan?.necesidades.water || 2.5,
          weightKg: Number(checkin.weight || 0) || undefined,
          energy: checkin.energy,
          mood: checkin.mood,
        },
      }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleMeal = async (tipoComida: string, completado: boolean) => {
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "meal",
        payload: {
          dateIso: new Date().toISOString(),
          mealType: tipoComida,
          completed: !completado,
        },
      }),
    })
    setMealTracking(prev => prev.map(m => 
      m.tipoComida === tipoComida ? { ...m, completado: !completado } : m
    ))
  }

  const toggleExercise = async (ejercicio: string, completado: boolean) => {
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "exercise",
        payload: {
          dateIso: new Date().toISOString(),
          exerciseId: ejercicio,
          completed: !completado,
        },
      }),
    })
    setExerciseTracking(prev => prev.map(e => 
      e.ejercicio === ejercicio ? { ...e, completado: !completado } : e
    ))
  }

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })

  const mealTypes = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"]

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hoy</h1>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>
        {saved && <Badge className="bg-green-500">Guardado</Badge>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Check-in diario</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Agua (L)
            </Label>
            <Input 
              type="number" 
              step="0.1" 
              value={checkin.water} 
              onChange={(e) => setCheckin(p => ({ ...p, water: e.target.value }))}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Scale className="h-3 w-3" /> Peso (kg)
            </Label>
            <Input 
              type="number" 
              step="0.1" 
              value={checkin.weight} 
              onChange={(e) => setCheckin(p => ({ ...p, weight: e.target.value }))}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Battery className="h-3 w-3" /> Energía (1-5)
            </Label>
            <Input 
              type="number" 
              min={1} 
              max={5} 
              value={checkin.energy}
              onChange={(e) => setCheckin(p => ({ ...p, energy: Math.min(5, Math.max(1, Number(e.target.value) || 1)) }))}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Smile className="h-3 w-3" /> Ánimo (1-5)
            </Label>
            <Input 
              type="number" 
              min={1} 
              max={5} 
              value={checkin.mood}
              onChange={(e) => setCheckin(p => ({ ...p, mood: Math.min(5, Math.max(1, Number(e.target.value) || 1)) }))}
              className="h-9"
            />
          </div>
          <div className="md:col-span-4">
            <Button onClick={guardarCheckin} size="sm">Guardar check-in</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Utensils className="h-4 w-4" /> Comidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mealTypes.map((tipo) => {
            const meal = plan?.planComidas[tipo]?.[0]
            const tracking = mealTracking.find(m => m.tipoComida === tipo)
            return (
              <div key={tipo} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <button 
                  onClick={() => toggleMeal(tipo, tracking?.completado || false)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {tracking?.completado ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{tipo}</p>
                    {meal && (
                      <p className="text-xs text-muted-foreground">{meal.main} {meal.side && `+ ${meal.side}`}</p>
                    )}
                  </div>
                </button>
                {meal && (
                  <Badge variant="secondary" className="text-xs">{meal.calories} kcal</Badge>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {plan?.planComidas["Entreno"] && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Entrenamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.planComidas["Entreno"].map((ejercicio: any, idx: number) => {
              const tracking = exerciseTracking[idx]
              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <button 
                    onClick={() => toggleExercise(String(idx), tracking?.completado || false)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {tracking?.completado ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{ejercicio.name || ejercicio}</p>
                      {ejercicio.sets && (
                        <p className="text-xs text-muted-foreground">{ejercicio.sets} series × {ejercicio.reps} repes</p>
                      )}
                    </div>
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {plan?.necesidades && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Macros del día</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-500">{plan.necesidades.calories}</p>
              <p className="text-xs text-muted-foreground">Calorías</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{plan.necesidades.protein}g</p>
              <p className="text-xs text-muted-foreground">Proteína</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{plan.necesidades.carbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{plan.necesidades.fat}g</p>
              <p className="text-xs text-muted-foreground">Grasa</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}