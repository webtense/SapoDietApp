"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, CheckCircle2, Circle, Dumbbell, Droplets, Flame, Scale, SkipForward, Sparkles, Utensils, AlertCircle, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { MacroRing } from "@/components/macro-ring"
import { defaultV3Preferences, parseV3Preferences, V3_PREFERENCES_KEY } from "@/lib/v3-preferences"
import { normalizeMacros } from "@/lib/plan-normalizers"
import type { NormalizedMacros } from "@/lib/plan-normalizers"

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
  const [plan, setPlan] = useState<{ necesidades: NormalizedMacros; planComidas: MealPlan; planEntreno?: any[] } | null>(null)
  const [mealTracking, setMealTracking] = useState<MealTracking[]>([])
  const [exerciseTracking, setExerciseTracking] = useState<ExerciseTracking[]>([])
  const [checkin, setCheckin] = useState({ water: "", weight: "", energy: 3, mood: 3 })
  const [prefs, setPrefs] = useState(defaultV3Preferences)
  const [hasLoadedFromApi, setHasLoadedFromApi] = useState(false)
  const [planSemana, setPlanSemana] = useState<{ semana: number; completadas: number; total: number } | null>(null)
  const [alternativesFor, setAlternativesFor] = useState<string | null>(null)
  const [loadingAlternatives, setLoadingAlternatives] = useState(false)
  const [alternatives, setAlternatives] = useState<Meal[]>([])
  const [alternativesFromAi, setAlternativesFromAi] = useState(true)
  const [replacingMeal, setReplacingMeal] = useState(false)
  const [showQuickMeal, setShowQuickMeal] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [last7Days, setLast7Days] = useState<Array<{ date: string; weight?: number; energy?: number; mood?: number }>>([])

  useEffect(() => {
    // Generar datos simulados para últimos 7 días (en producción vendría de API)
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        weight: checkin.weight ? Number(checkin.weight) - (Math.random() * 0.5 - 0.25) : undefined,
        energy: checkin.energy,
        mood: checkin.mood,
      })
    }
    setLast7Days(days)
  }, [checkin])

  useEffect(() => {
    const load = async () => {
      const stored = window.localStorage.getItem(V3_PREFERENCES_KEY)
      if (stored) {
        setPrefs(parseV3Preferences(JSON.parse(stored)))
      }

      const lastCheckin = window.localStorage.getItem("sapofit_last_checkin")
      if (lastCheckin) {
        try {
          const parsed = JSON.parse(lastCheckin)
          setCheckin(parsed)
        } catch {}
      }

      try {
        const rawPlan = window.localStorage.getItem("sapofit-plan4s-v1")
        if (rawPlan) {
          const ps = JSON.parse(rawPlan) as { semana: number; sesionesCompletadas: Record<string, boolean> }
          const semana = ps.semana ?? 1
          const total = 4
          const completadas = Object.keys(ps.sesionesCompletadas ?? {}).filter(k => k.startsWith(`${semana}-`)).length
          setPlanSemana({ semana, completadas, total })
        }
      } catch {}

      const [planRes, trackingRes] = await Promise.all([fetch("/api/plan"), fetch("/api/tracking")])

      if (planRes.ok) {
        const p = await planRes.json()
        if (p.plan?.planJson) {
          const parsed = JSON.parse(p.plan.planJson)
          setPlan({
            necesidades: normalizeMacros(parsed.macros || parsed.necesidades),
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
          const storedCheckin = window.localStorage.getItem("sapofit_last_checkin")
          let storedParsed = null
          if (storedCheckin) {
            try { storedParsed = JSON.parse(storedCheckin) } catch {}
          }
          
          if (storedParsed) {
            setCheckin(storedParsed)
          } else if (t.dailyLog.waterLiters || t.dailyLog.weightKg || t.dailyLog.energy || t.dailyLog.mood) {
            setCheckin({
              water: t.dailyLog.waterLiters ? String(t.dailyLog.waterLiters) : "",
              weight: t.dailyLog.weightKg ? String(t.dailyLog.weightKg) : "",
              energy: t.dailyLog.energy || 3,
              mood: t.dailyLog.mood || 3,
            })
          }
        }
      }

      setHasLoadedFromApi(true)
      setLoading(false)
    }

    load()
  }, [])

  const guardarCheckin = async () => {
    window.localStorage.setItem("sapofit_last_checkin", JSON.stringify(checkin))
    
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

  const openAlternatives = async (mealType: string) => {
    setAlternativesFor(mealType)
    setLoadingAlternatives(true)
    setAlternatives([])
    try {
      const res = await fetch("/api/plan/meal/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType }),
      })
      const data = await res.json()
      if (res.ok) {
        setAlternatives(data.alternatives || [])
        setAlternativesFromAi(Boolean(data.fromAi))
      }
    } finally {
      setLoadingAlternatives(false)
    }
  }

  const chooseAlternative = async (mealType: string, meal: Meal) => {
    setReplacingMeal(true)
    try {
      const res = await fetch("/api/plan/meal/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType, meal }),
      })
      if (res.ok) {
        setPlan((prev) => prev ? { ...prev, planComidas: { ...prev.planComidas, [mealType]: meal } } : prev)
        setAlternativesFor(null)
      }
    } finally {
      setReplacingMeal(false)
    }
  }

  const completedMeals = useMemo(() => mealTracking.filter((item) => item.completed).length, [mealTracking])
  const completedExercises = useMemo(() => exerciseTracking.filter((item) => item.completed).length, [exerciseTracking])
  const dailyProgress = Math.round((((completedMeals / mealConfig.length) * 0.6) + ((plan?.planEntreno?.length ? completedExercises / plan.planEntreno.length : 0) * 0.4)) * 100)

  const estimatedCaloriesConsumed = useMemo(() => {
    if (!plan) return 0
    return mealConfig.reduce((sum, mealInfo) => {
      const meal = plan.planComidas[mealInfo.key as keyof MealPlan]
      const track = mealTracking.find((t) => t.mealType === mealInfo.key)
      return track?.completed && meal ? sum + (meal.calorias || 0) : sum
    }, 0)
  }, [mealTracking, plan])

  const estimatedMacrosConsumed = useMemo(() => {
    if (!plan) return { protein: 0, carbs: 0, fat: 0 }
    return mealConfig.reduce((sum, mealInfo) => {
      const meal = plan.planComidas[mealInfo.key as keyof MealPlan]
      const track = mealTracking.find((t) => t.mealType === mealInfo.key)
      if (track?.completed && meal) {
        return {
          protein: sum.protein + (meal.proteinas || 0),
          carbs: sum.carbs + (meal.carbohidratos || 0),
          fat: sum.fat + (meal.grasas || 0),
        }
      }
      return sum
    }, { protein: 0, carbs: 0, fat: 0 })
  }, [mealTracking, plan])

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(14,26,19,0.92),_rgba(80,200,120,0.72))] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-5">
          <div>
            <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">Agenda del día</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Hoy</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              {prefs.needsTupperMeals ? "Modo tupper activado" : "Modo cocina en casa"} · {prefs.hasAirfryer ? "recetas con opción Airfryer" : "recetas estándar"} · {prefs.primaryGoal.toLowerCase()}.
            </p>
          </div>

          {/* Próxima comida */}
          {(() => {
            const nextMealIndex = mealConfig.findIndex(m => {
              const track = mealTracking.find(t => t.mealType === m.key)
              return !track?.completed
            })
            if (nextMealIndex !== -1) {
              const nextMeal = mealConfig[nextMealIndex]
              return (
                <div className="rounded-xl bg-white/10 px-4 py-2 flex items-center gap-2 text-sm">
                  <ChevronUp className="h-4 w-4 text-yellow-300" />
                  <span>Próxima: <strong>{nextMeal.label}</strong></span>
                </div>
              )
            }
            return null
          })()}

          {/* Anillos de macros */}
          <div className="rounded-[1.5rem] bg-white/12 p-4 backdrop-blur space-y-4">
            {/* Calorías + Resumen */}
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <MacroRing
                  consumed={Math.round(estimatedCaloriesConsumed)}
                  target={Math.round(plan?.necesidades.calories || 2000)}
                  label="Calorías"
                  shortLabel="kcal"
                  color="#34d399"
                  unit=""
                />
                <MacroRing
                  consumed={Math.round(estimatedMacrosConsumed.protein)}
                  target={Math.round(plan?.necesidades.protein || 150)}
                  label="Proteína"
                  shortLabel="P"
                  color="#60a5fa"
                  unit="g"
                />
              </div>
              <div className="min-w-0 flex-1 text-right">
                {(() => {
                  const goal = plan?.necesidades.calories || 2000
                  const remaining = goal - estimatedCaloriesConsumed
                  const over = remaining < 0
                  return (
                    <div className="mb-2">
                      <p className={`text-lg font-semibold leading-none ${over ? "text-red-300" : ""}`}>
                        {over ? `+${Math.abs(remaining)}` : remaining}
                      </p>
                      <p className="text-xs text-white/70">{over ? "excedente" : "restantes"}</p>
                    </div>
                  )
                })()}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div><p className="font-semibold">{completedMeals}/{mealConfig.length}</p><p className="text-white/70">Comidas</p></div>
                  <div><p className="font-semibold">{completedExercises}</p><p className="text-white/70">Ejercicios</p></div>
                </div>
              </div>
            </div>

            {/* Carbs + Grasas */}
            <div className="flex gap-4">
              <MacroRing
                consumed={Math.round(estimatedMacrosConsumed.carbs)}
                target={Math.round(plan?.necesidades.carbs || 250)}
                label="Carbohidratos"
                shortLabel="C"
                color="#fbbf24"
                unit="g"
              />
              <MacroRing
                consumed={Math.round(estimatedMacrosConsumed.fat)}
                target={Math.round(plan?.necesidades.fat || 65)}
                label="Grasas"
                shortLabel="G"
                color="#f87171"
                unit="g"
              />
            </div>

            {/* Hidratación interactiva + Progreso */}
            <div className="space-y-3 pt-3 border-t border-white/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                    <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> Hidratación</span>
                    <span>{checkin.water || 0} / {plan?.necesidades.water || 2.5}L</span>
                  </div>
                  <Progress value={Math.min(100, ((Number(checkin.water || 0) / (plan?.necesidades.water || 2.5)) * 100))} className="bg-white/20 h-2" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setCheckin((p) => ({ ...p, water: String((Number(p.water || 0) - 0.25).toFixed(2)) }))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-xs font-bold hover:bg-white/30 active:scale-95">−</button>
                  <button onClick={() => setCheckin((p) => ({ ...p, water: String((Number(p.water || 0) + 0.25).toFixed(2)) }))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-xs font-bold hover:bg-white/30 active:scale-95">+</button>
                </div>
              </div>

              <div className="mb-1 flex items-center justify-between text-xs text-white/70"><span>Progreso diario</span><span>{dailyProgress}%</span></div>
              <Progress value={dailyProgress} className="bg-white/20 [&_[data-slot=progress-indicator]]:bg-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Notificaciones inteligentes */}
      {(() => {
        const alerts = []
        const proteinGoal = plan?.necesidades.protein || 150
        const waterGoal = plan?.necesidades.water || 2.5
        if (estimatedMacrosConsumed.protein < proteinGoal * 0.5) alerts.push(`Faltan ${Math.round(proteinGoal - estimatedMacrosConsumed.protein)}g de proteína`)
        if (Number(checkin.water || 0) < waterGoal * 0.5) alerts.push(`Faltan ${(waterGoal - Number(checkin.water || 0)).toFixed(1)}L de agua`)
        if (completedMeals === 0 && new Date().getHours() > 12) alerts.push("¡No has registrado ninguna comida hoy!")

        return alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                {alert}
              </div>
            ))}
          </div>
        ) : null
      })()}

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
                        <Button size="sm" variant="outline" onClick={() => openAlternatives(mealInfo.key)}><Sparkles className="mr-1 h-4 w-4" /> Más opciones</Button>
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

                    {alternativesFor === mealInfo.key && (
                      <div className="mt-3 space-y-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            {loadingAlternatives ? "Generando opciones con IA…" : alternativesFromAi ? "Opciones sugeridas por IA" : "Opciones (sin IA disponible ahora)"}
                          </p>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setAlternativesFor(null)}>Cerrar</Button>
                        </div>

                        {loadingAlternatives && <p className="text-sm text-muted-foreground">Un momento…</p>}

                        {!loadingAlternatives && alternatives.map((alt, i) => (
                          <div key={i} className="rounded-xl border bg-white p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">{alt.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  {alt.calorias} kcal · P {alt.proteinas}g · C {alt.carbohidratos}g · G {alt.grasas}g
                                </p>
                                {alt.ingredientes?.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {alt.ingredientes.slice(0, 5).map((ing, j) => (
                                      <Badge key={j} variant="secondary" className="font-normal text-[10px]">
                                        {ing.nombre}{ing.cantidad ? ` · ${ing.cantidad}${ing.unidad || "g"}` : ""}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button size="sm" disabled={replacingMeal} onClick={() => chooseAlternative(mealInfo.key, alt)}>
                                Elegir
                              </Button>
                            </div>
                          </div>
                        ))}

                        {!loadingAlternatives && alternatives.length === 0 && (
                          <p className="text-sm text-muted-foreground">No se pudieron generar opciones, inténtalo de nuevo.</p>
                        )}
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

              {/* Peso — widget táctil */}
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="mb-3 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Scale className="h-3 w-3" /> Peso de hoy</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button onClick={() => setCheckin((p) => ({ ...p, weight: String(Math.max(30, Number(p.weight || 70) - 1).toFixed(1)) }))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold shadow-sm active:scale-95">−1</button>
                    <button onClick={() => setCheckin((p) => ({ ...p, weight: String(Math.max(30, Number(p.weight || 70) - 0.1).toFixed(1)) }))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold shadow-sm active:scale-95">−.1</button>
                  </div>
                  <input type="number" step="0.1" inputMode="decimal"
                    value={checkin.weight}
                    onChange={(e) => setCheckin((p) => ({ ...p, weight: e.target.value }))}
                    className="w-24 rounded-2xl border-0 bg-white py-2 text-center text-2xl font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  <div className="flex gap-1">
                    <button onClick={() => setCheckin((p) => ({ ...p, weight: String((Number(p.weight || 70) + 0.1).toFixed(1)) }))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold shadow-sm active:scale-95">+.1</button>
                    <button onClick={() => setCheckin((p) => ({ ...p, weight: String((Number(p.weight || 70) + 1).toFixed(1)) }))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold shadow-sm active:scale-95">+1</button>
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">kg</p>
              </div>

              {/* Agua + Energía + Ánimo */}
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="mb-1 flex items-center gap-1 text-xs"><Droplets className="h-3 w-3" /> Agua (L)</Label><Input type="number" step="0.1" inputMode="decimal" value={checkin.water} onChange={(e) => setCheckin((prev) => ({ ...prev, water: e.target.value }))} /></div>
                <div><Label className="mb-1 flex items-center gap-1 text-xs"><Flame className="h-3 w-3" /> Energía 1-5</Label><Input type="number" min={1} max={5} value={checkin.energy} onChange={(e) => setCheckin((prev) => ({ ...prev, energy: Math.min(5, Math.max(1, Number(e.target.value) || 1)) }))} /></div>
                <div><Label className="mb-1 flex items-center gap-1 text-xs"><Activity className="h-3 w-3" /> Ánimo 1-5</Label><Input type="number" min={1} max={5} value={checkin.mood} onChange={(e) => setCheckin((prev) => ({ ...prev, mood: Math.min(5, Math.max(1, Number(e.target.value) || 1)) }))} /></div>
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

          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                Últimos 7 días
                <button onClick={() => setDarkMode(!darkMode)} className="text-xs px-2 py-1 rounded-lg bg-muted hover:bg-muted/80">
                  {darkMode ? "🌙" : "☀️"}
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Peso */}
              <div>
                <p className="font-medium mb-2">Peso (kg)</p>
                <div className="flex gap-1 h-12 items-end">
                  {last7Days.map((day, i) => {
                    const weights = last7Days.filter(d => d.weight).map(d => d.weight || 0)
                    const minWeight = weights.length > 0 ? Math.min(...weights) : 70
                    const maxWeight = weights.length > 0 ? Math.max(...weights) : 71
                    const range = maxWeight - minWeight || 1
                    const height = day.weight ? ((day.weight - minWeight) / range * 100) : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-emerald-200 rounded-t" style={{ height: `${Math.max(height, 20)}%` }} title={day.weight?.toFixed(1)} />
                        <p className="text-[10px] text-muted-foreground mt-1">{day.date.split('-')[2]}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Energía + Ánimo */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-medium mb-2 text-[12px]">Energía</p>
                  <div className="flex gap-1">
                    {last7Days.map((day, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className="text-sm font-bold text-amber-600">{day.energy || 3}</div>
                        <p className="text-[10px] text-muted-foreground">{day.date.split('-')[2]}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-2 text-[12px]">Ánimo</p>
                  <div className="flex gap-1">
                    {last7Days.map((day, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className="text-sm font-bold text-blue-600">{day.mood || 3}</div>
                        <p className="text-[10px] text-muted-foreground">{day.date.split('-')[2]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan 4 semanas — acceso rápido */}
          <Card className="rounded-[1.75rem] shadow-sm border-emerald-200 bg-[linear-gradient(135deg,_rgba(4,47,31,0.03),_rgba(16,185,129,0.06))]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="h-4 w-4 text-emerald-600" /> Plan 4 semanas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {planSemana ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Semana actual</span>
                    <Badge className="bg-emerald-500 text-white">{planSemana.semana} / 4</Badge>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Sesiones completadas</span>
                      <span>{planSemana.completadas} / {planSemana.total}</span>
                    </div>
                    <Progress
                      value={Math.round((planSemana.completadas / planSemana.total) * 100)}
                      className="[&_[data-slot=progress-indicator]]:bg-emerald-500"
                    />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Aún no has iniciado el plan. 4 semanas de progresión sin equipo.</p>
              )}
              <a href="/entrenamiento" className="block w-full rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                Ir a Entrenamiento →
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botón flotante para marcar comida rápido */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 items-end">
        {showQuickMeal && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-2 max-w-xs">
            <p className="text-sm font-semibold mb-3">Marcar comida como hecha</p>
            <div className="grid grid-cols-2 gap-2">
              {mealConfig.map((mealInfo) => {
                const track = mealTracking.find((item) => item.mealType === mealInfo.key)
                return (
                  <Button
                    key={mealInfo.key}
                    size="sm"
                    variant={track?.completed ? "default" : "outline"}
                    onClick={() => {
                      updateMeal(mealInfo.key, !track?.completed, true)
                    }}
                    className="text-xs"
                  >
                    {mealInfo.label} {track?.completed && "✓"}
                  </Button>
                )
              })}
            </div>
            <Button size="sm" variant="ghost" className="w-full mt-2 text-xs" onClick={() => setShowQuickMeal(false)}>
              Cerrar
            </Button>
          </div>
        )}
        <button
          onClick={() => setShowQuickMeal(!showQuickMeal)}
          className="h-14 w-14 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 flex items-center justify-center active:scale-95 transition-all"
        >
          <CheckCircle2 className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
