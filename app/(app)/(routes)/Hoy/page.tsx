"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, CheckCircle2, Circle, Droplets, Flame, Scale, SkipForward, Sparkles, Utensils } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { defaultV3Preferences, parseV3Preferences, V3_PREFERENCES_KEY } from "@/lib/v3-preferences"
import type { NutritionalNeeds } from "@/lib/diet-calculator"

interface Ingredient {
  nombre: string
  cantidad: number
  unidad: string
}

interface Meal {
  nombre: string
  ingredientes: Ingredient[]
  instrucciones: string[]
  calorias: number
  proteinas: number
  carbohidratos: number
  grasas: number
  tiempoPreparacion?: number
}

interface MealPlan {
  desayuno?: Meal
  mediaManana?: Meal
  almuerzo?: Meal
  merienda?: Meal
  cena?: Meal
}

interface MealTracking {
  mealType: string
  completed: boolean
  followsPlan?: boolean
}

interface ExerciseTracking {
  exerciseId: string
  completed: boolean
}

const mealConfig = [
  { label: "Desayuno", key: "desayuno" },
  { label: "Snack", key: "mediaManana" },
  { label: "Comida", key: "almuerzo" },
  { label: "Merienda", key: "merienda" },
  { label: "Cena", key: "cena" },
] as const

export default function HoyPage() {
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [plan, setPlan] = useState<{ necesidades: NutritionalNeeds; planComidas: MealPlan; planEntreno?: any[] } | null>(null)
  const [mealTracking, setMealTracking] = useState<MealTracking[]>([])
  const [exerciseTracking, setExerciseTracking] = useState<ExerciseTracking[]>([])
  const [checkin, setCheckin] = useState({ water: "", weight: "", energy: 3, mood: 3 })
  const [prefs, setPrefs] = useState(defaultV3Preferences)

  useEffect(() => {
    const load = async () => {
      const stored = window.localStorage.getItem(V3_PREFERENCES_KEY)
      if (stored) {
        setPrefs(parseV3Preferences(JSON.parse(stored)))
      }

      const [planRes, trackingRes] = await Promise.all([fetch("/api/plan"), fetch("/api/tracking")])

      if (planRes.ok) {
        const p = await planRes.json()
        if (p.plan?.planJson) {
          const parsed = JSON.parse(p.plan.planJson)
          setPlan({
            necesidades: parsed.macros || parsed.necesidades,
            planComidas: parsed.mealPlan || parsed.planComidas,
            planEntreno: parsed.exercisePlan || parsed.planEntreno || [],
          })
        }
      }

      if (trackingRes.ok) {
        const t = await trackingRes.json()
        setMealTracking((t.mealLogs || []).map((m: any) => ({ mealType: m.mealType, completed: m.completed, followsPlan: m.followsPlan })))
        setExerciseTracking((t.exerciseLogs || []).map((e: any) => ({ exerciseId: e.exerciseId, completed: e.completed })))
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
    setTimeout(() => setSaved(false), 1800)
  }

  const updateMeal = async (mealType: string, completed: boolean, followsPlan = true) => {
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "meal",
        payload: {
          dateIso: new Date().toISOString(),
          mealType,
          completed,
          followsPlan,
        },
      }),
    })

    setMealTracking((prev) => {
      const current = prev.find((item) => item.mealType === mealType)
      if (!current) {
        return [...prev, { mealType, completed, followsPlan }]
      }
      return prev.map((item) => item.mealType === mealType ? { ...item, completed, followsPlan } : item)
    })
  }

  const completedMeals = useMemo(() => mealTracking.filter((item) => item.completed).length, [mealTracking])
  const completedExercises = useMemo(() => exerciseTracking.filter((item) => item.completed).length, [exerciseTracking])
  const dailyProgress = Math.round((((completedMeals / mealConfig.length) * 0.6) + ((plan?.planEntreno?.length ? completedExercises / plan.planEntreno.length : 0) * 0.4)) * 100)

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(14,26,19,0.92),_rgba(80,200,120,0.72))] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">Agenda del día</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Hoy</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              {prefs.needsTupperMeals ? "Modo tupper activado" : "Modo cocina en casa"} · {prefs.hasAirfryer ? "recetas con opción Airfryer" : "recetas estándar"} · {prefs.primaryGoal.toLowerCase()}.
            </p>
          </div>
          <div className="min-w-64 rounded-[1.5rem] bg-white/12 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between text-sm"><span>Progreso diario</span><span>{dailyProgress}%</span></div>
            <Progress value={dailyProgress} className="bg-white/20 [&_[data-slot=progress-indicator]]:bg-white" />
            <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
              <div><p className="text-lg font-semibold">{completedMeals}/{mealConfig.length}</p><p className="text-white/75">Comidas</p></div>
              <div><p className="text-lg font-semibold">{completedExercises}</p><p className="text-white/75">Ejercicios</p></div>
              <div><p className="text-lg font-semibold">{plan?.necesidades.water || 2.5}L</p><p className="text-white/75">Meta agua</p></div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Utensils className="h-4 w-4" /> Menú diario interactivo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mealConfig.map((mealInfo) => {
                const meal = plan?.planComidas[mealInfo.key as keyof MealPlan]
                const track = mealTracking.find((item) => item.mealType === mealInfo.key)

                return (
                  <div key={mealInfo.key} className="rounded-[1.5rem] border bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <button onClick={() => updateMeal(mealInfo.key, !(track?.completed || false), true)} className="flex flex-1 items-start gap-3 text-left">
                        {track?.completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{mealInfo.label}</p>
                            {meal && <Badge variant="secondary">{meal.calorias} kcal</Badge>}
                            {prefs.needsTupperMeals && mealInfo.key === "almuerzo" && <Badge variant="outline">Apto tupper</Badge>}
                            {prefs.hasAirfryer && (mealInfo.key === "cena" || mealInfo.key === "almuerzo") && <Badge variant="outline">Airfryer</Badge>}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{meal?.nombre || "Pendiente de generar en tu plan"}</p>
                        </div>
                      </button>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button size="sm" variant="outline" onClick={() => updateMeal(mealInfo.key, true, true)}>Hecho</Button>
                        <Button size="sm" variant="outline" onClick={() => updateMeal(mealInfo.key, false, false)}><SkipForward className="mr-1 h-4 w-4" /> Omitir</Button>
                        <Button size="sm" variant="outline" disabled><Sparkles className="mr-1 h-4 w-4" /> Cambiar receta</Button>
                      </div>
                    </div>

                    {meal && (
                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            {meal.ingredientes.slice(0, 5).map((ingredient) => (
                              <Badge key={`${mealInfo.key}-${ingredient.nombre}`} variant="secondary" className="font-normal">
                                {ingredient.nombre} · {ingredient.cantidad}{ingredient.unidad}
                              </Badge>
                            ))}
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">
                            {meal.instrucciones?.[0] || "Sigue la receta del plan."}
                            {prefs.hasAirfryer && (mealInfo.key === "almuerzo" || mealInfo.key === "cena") ? " También puedes adaptarla a Airfryer para reducir tiempo." : ""}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-muted/50 p-3 text-sm">
                          <p><span className="font-medium">P</span> {meal.proteinas}g</p>
                          <p><span className="font-medium">C</span> {meal.carbohidratos}g</p>
                          <p><span className="font-medium">G</span> {meal.grasas}g</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Check-in diario</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-1 flex items-center gap-1 text-xs"><Droplets className="h-3 w-3" /> Agua</Label><Input type="number" step="0.1" value={checkin.water} onChange={(e) => setCheckin((prev) => ({ ...prev, water: e.target.value }))} /></div>
                <div><Label className="mb-1 flex items-center gap-1 text-xs"><Scale className="h-3 w-3" /> Peso</Label><Input type="number" step="0.1" value={checkin.weight} onChange={(e) => setCheckin((prev) => ({ ...prev, weight: e.target.value }))} /></div>
                <div><Label className="mb-1 flex items-center gap-1 text-xs"><Flame className="h-3 w-3" /> Energía</Label><Input type="number" min={1} max={5} value={checkin.energy} onChange={(e) => setCheckin((prev) => ({ ...prev, energy: Math.min(5, Math.max(1, Number(e.target.value) || 1)) }))} /></div>
                <div><Label className="mb-1 flex items-center gap-1 text-xs"><Activity className="h-3 w-3" /> Ánimo</Label><Input type="number" min={1} max={5} value={checkin.mood} onChange={(e) => setCheckin((prev) => ({ ...prev, mood: Math.min(5, Math.max(1, Number(e.target.value) || 1)) }))} /></div>
              </div>
              <Button className="w-full rounded-2xl" onClick={guardarCheckin}>Guardar check-in</Button>
              {saved && <Badge className="bg-emerald-500 text-white">Check-in guardado</Badge>}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Objetivos del día</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl bg-muted/50 p-4"><p className="font-medium">Hidratación</p><p className="mt-1 text-muted-foreground">Meta {plan?.necesidades.water || 2.5}L. Hoy llevas {checkin.water || 0}L.</p></div>
              <div className="rounded-2xl bg-muted/50 p-4"><p className="font-medium">Proteína</p><p className="mt-1 text-muted-foreground">Objetivo de {plan?.necesidades.protein || 0}g para apoyar {prefs.primaryGoal.toLowerCase()}.</p></div>
              <div className="rounded-2xl bg-muted/50 p-4"><p className="font-medium">Constancia</p><p className="mt-1 text-muted-foreground">Marca tus comidas y tu entreno aunque estés offline; el módulo de entrenamiento ya conserva progreso local.</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
