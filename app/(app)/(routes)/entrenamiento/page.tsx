"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Circle, Clock3, Dumbbell, Lightbulb, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { normalizeExercisePlan } from "@/lib/plan-normalizers"

interface Exercise {
  id: string
  name: string
  categoria?: string
  sets?: number
  reps?: number
  duration?: number
  rest?: number
  muscleGroups?: string[]
}

interface ExerciseTracking {
  exerciseId: string
  completed: boolean
  durationSec?: number
}

interface Recommendations {
  recommendation: string
  precautions: string[]
}

const OFFLINE_KEY = "sapofit-v3-offline-training"

export default function EntrenamientoPage() {
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [tracking, setTracking] = useState<ExerciseTracking[]>([])
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restExerciseName, setRestExerciseName] = useState("")

  const loadOfflineQueue = () => {
    try {
      return JSON.parse(window.localStorage.getItem(OFFLINE_KEY) || "[]") as ExerciseTracking[]
    } catch {
      return []
    }
  }

  const saveOfflineQueue = (items: ExerciseTracking[]) => {
    window.localStorage.setItem(OFFLINE_KEY, JSON.stringify(items))
  }

  const syncOfflineQueue = async () => {
    if (!navigator.onLine) return

    const queue = loadOfflineQueue()
    for (const item of queue) {
      await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "exercise",
          payload: {
            dateIso: new Date().toISOString(),
            exerciseId: item.exerciseId,
            completed: item.completed,
            durationSec: item.durationSec || 0,
          },
        }),
      })
    }
    saveOfflineQueue([])
  }

  useEffect(() => {
    const load = async () => {
      setOnline(navigator.onLine)
      await syncOfflineQueue()

      const [planRes, trackingRes, recsRes] = await Promise.all([
        fetch("/api/plan"),
        fetch("/api/tracking"),
        fetch("/api/plan/recommendations?type=recommendations"),
      ])

      if (planRes.ok) {
        const data = await planRes.json()
        if (data.plan?.planJson) {
          const parsed = JSON.parse(data.plan.planJson)
          setExercises(normalizeExercisePlan(parsed.exercisePlan))
        }
      }

      if (trackingRes.ok) {
        const data = await trackingRes.json()
        setTracking((data.exerciseLogs || []).map((entry: any) => ({
          exerciseId: entry.exerciseId,
          completed: entry.completed,
          durationSec: entry.durationSec,
        })))
      }

      if (recsRes.ok) {
        const data = await recsRes.json()
        if (data.recommendation) {
          setRecommendations({ recommendation: data.recommendation, precautions: data.precautions || [] })
        }
      }

      setLoading(false)
    }

    const handleOnline = async () => {
      setOnline(true)
      await syncOfflineQueue()
    }

    const handleOffline = () => setOnline(false)

    load()
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const toggleExercise = async (idx: number) => {
    const exercise = exercises[idx]
    if (!exercise) return
    const exerciseId = exercise.id
    const current = tracking.find((item) => item.exerciseId === exerciseId)
    const next = { exerciseId, completed: !current?.completed, durationSec: exercise.duration || 0 }

    setTracking((prev) => {
      const hasExisting = prev.some((item) => item.exerciseId === exerciseId)
      if (!hasExisting) return [...prev, next]
      return prev.map((item) => item.exerciseId === exerciseId ? next : item)
    })

    if (!current?.completed) startRest(exercise.rest || 30, exercise.name)

    if (!navigator.onLine) {
      const queue = loadOfflineQueue().filter((item) => item.exerciseId !== exerciseId)
      saveOfflineQueue([...queue, next])
      return
    }

    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "exercise",
        payload: {
          dateIso: new Date().toISOString(),
          exerciseId,
          completed: next.completed,
          durationSec: next.durationSec || 0,
        },
      }),
    })
  }

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) {
      if (restTimer === 0) {
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200])
        setRestTimer(null)
      }
      return
    }
    const id = setTimeout(() => setRestTimer((t) => (t ?? 1) - 1), 1000)
    return () => clearTimeout(id)
  }, [restTimer])

  const startRest = (seconds: number, name: string) => {
    setRestTimer(seconds)
    setRestExerciseName(name)
  }

  const completedCount = useMemo(() => tracking.filter((item) => item.completed).length, [tracking])
  const completion = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0
  const totalMinutes = Math.round(exercises.reduce((sum, item) => sum + ((item.duration || 0) / 60), 0))

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,_rgba(10,12,16,0.96),_rgba(32,37,49,0.96))] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium">Modo inmersivo</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Entrenamiento</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">Vista más enfocada en circuitos, tiempos y progreso. El marcado de ejercicios se conserva incluso sin WiFi.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={online ? "bg-emerald-500 text-white" : "bg-amber-500 text-black"}>
              {online ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
              {online ? "Online" : "Offline"}
            </Badge>
            <Badge variant="secondary">{totalMinutes} min</Badge>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] bg-white/8 p-4 backdrop-blur">
          <div className="mb-2 flex items-center justify-between text-sm"><span>Completado</span><span>{completion}%</span></div>
          <Progress value={completion} className="bg-white/10 [&_[data-slot=progress-indicator]]:bg-emerald-400" />
        </div>
      </section>

      {recommendations && (
        <Card className="rounded-[1.75rem] border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(80,200,120,0.08))] shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4 text-amber-500" /> Recomendaciones personalizadas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{recommendations.recommendation}</p>
            <div className="flex flex-wrap gap-2">
              {recommendations.precautions.map((item) => <Badge key={item} variant="outline"><AlertTriangle className="mr-1 h-3 w-3" />{item}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}

      {exercises.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Dumbbell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><p className="text-muted-foreground">No tienes ejercicios asignados todavía.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {exercises.map((exercise, idx) => {
              const status = tracking.find((item) => item.exerciseId === exercise.id)
              const completed = !!status?.completed

              return (
                <Card key={`${exercise.name}-${idx}`} className={`rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm ${completed ? "ring-1 ring-emerald-300" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <button onClick={() => toggleExercise(idx)} className="mt-1">
                        {completed ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                             <h3 className="font-medium">{exercise.name}</h3>
                             <p className="text-sm text-muted-foreground">{exercise.categoria || exercise.muscleGroups?.[0] || "Circuito funcional"}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {exercise.sets && <Badge variant="secondary">{exercise.sets} series</Badge>}
                            {exercise.reps && <Badge variant="secondary">{exercise.reps} reps</Badge>}
                            {exercise.duration && <Badge variant="secondary"><Clock3 className="mr-1 h-3 w-3" />{exercise.duration}s</Badge>}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/50 p-3 text-sm">
                          <p className="text-muted-foreground">Descanso sugerido: {exercise.rest || 30}s</p>
                          <Button variant="outline" size="sm" onClick={() => toggleExercise(idx)}>{completed ? "Marcar pendiente" : "Completar"}</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="space-y-4">
            <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Resumen de sesión</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-semibold">{completedCount}</p><p className="text-muted-foreground">Hechos</p></div>
                <div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-semibold">{completion}%</p><p className="text-muted-foreground">Avance</p></div>
                <div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-semibold">{totalMinutes}</p><p className="text-muted-foreground">Minutos</p></div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Offline listo</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Si entrenas en un gimnasio sin cobertura, los cambios se guardan localmente y se sincronizan cuando vuelves a tener conexión.</p>
                <p>Esto cubre la parte esencial del modo offline v3 sin cambiar tu backend actual.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Timer de descanso flotante — patrón FitBod/Stronglifts */}
      {restTimer !== null && (
        <div className="fixed bottom-20 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
          <div className="flex items-center gap-4 rounded-[1.75rem] bg-gray-900 p-4 shadow-2xl text-white">
            <div className="relative flex-shrink-0">
              {(() => {
                const total = 60
                const r = 24
                const circ = 2 * Math.PI * r
                const pct = Math.min(1, restTimer / total)
                return (
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                    <circle cx="30" cy="30" r={r} fill="none" stroke="#34d399" strokeWidth="4"
                      strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                      strokeLinecap="round" transform="rotate(-90 30 30)"
                      style={{ transition: "stroke-dashoffset 0.9s linear" }} />
                    <text x="30" y="35" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">{restTimer}s</text>
                  </svg>
                )
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/60">Descanso tras</p>
              <p className="truncate font-medium">{restExerciseName}</p>
            </div>
            <button onClick={() => setRestTimer(null)} className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20">
              Saltar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
