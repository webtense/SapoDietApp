"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Circle, Clock3,
  Dumbbell, Lightbulb, RotateCcw, Wifi, WifiOff, Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { normalizeExercisePlan } from "@/lib/plan-normalizers"

// ─── tipos ────────────────────────────────────────────────────────────────────
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
interface ProfileData {
  trainingFrequency?: string | null
  homeEquipment?: string | null
  age?: number | null
  weightKg?: number | null
  sex?: string | null
}

type Nivel = "principiante" | "intermedio" | "avanzado"
interface EjercicioPlan { name: string; base: string }
interface Sesion { foco: string; ejercicios: EjercicioPlan[] }
interface InfoSemana { volumen: string; descanso: string; nota: string }

// ─── constantes plan 4 semanas ────────────────────────────────────────────────
const EJERCICIOS_PLAN: Record<string, Record<Nivel, EjercicioPlan[]>> = {
  empuje: {
    principiante: [
      { name: "Flexiones (rodillas si necesario)", base: "3x8-10" },
      { name: "Fondos de tríceps en silla", base: "3x10" },
      { name: "Plancha frontal", base: "3x30s" },
    ],
    intermedio: [
      { name: "Flexiones diamante", base: "4x10-12" },
      { name: "Flexiones declinadas (pies en silla)", base: "4x10" },
      { name: "Pike push-up", base: "3x8-10" },
      { name: "Plancha + toque hombro", base: "3x20" },
    ],
    avanzado: [
      { name: "Flexiones arquero", base: "4x6/lado" },
      { name: "Pike push-up elevado", base: "4x8-10" },
      { name: "Pseudo-planche push-up", base: "4x6-8" },
      { name: "Plancha lagartija", base: "3x40s" },
    ],
  },
  tiron: {
    principiante: [
      { name: "Remo invertido (mesa)", base: "3x8" },
      { name: "Superman", base: "3x12" },
      { name: "Bird-dog", base: "3x10/lado" },
    ],
    intermedio: [
      { name: "Remo invertido pies elevados", base: "4x8-10" },
      { name: "Curl bíceps mochila", base: "4x10-12" },
      { name: "Y-T-W en suelo", base: "3x10" },
      { name: "Face-pull con toalla", base: "3x15" },
    ],
    avanzado: [
      { name: "Dominadas (puerta/barra)", base: "4x máx" },
      { name: "Remo arquero pies elevados", base: "4x6/lado" },
      { name: "Curl mochila lento (3s)", base: "4x10" },
    ],
  },
  pierna: {
    principiante: [
      { name: "Sentadilla aire", base: "3x12" },
      { name: "Zancada estática", base: "3x10/lado" },
      { name: "Glute bridge", base: "3x15" },
    ],
    intermedio: [
      { name: "Sentadilla búlgara (silla)", base: "4x10/lado" },
      { name: "Hip thrust suelo", base: "4x15" },
      { name: "Sentadilla con salto", base: "3x10" },
      { name: "Gemelo a una pierna", base: "3x15/lado" },
    ],
    avanzado: [
      { name: "Pistol squat asistida", base: "4x6/lado" },
      { name: "Búlgara con mochila", base: "4x10/lado" },
      { name: "Hip thrust una pierna", base: "4x10/lado" },
      { name: "Sentadilla saltada profunda", base: "4x8" },
    ],
  },
  core: {
    principiante: [
      { name: "Plancha frontal", base: "3x30s" },
      { name: "Dead bug", base: "3x10/lado" },
      { name: "Plancha lateral", base: "2x20s/lado" },
    ],
    intermedio: [
      { name: "Plancha 60s", base: "3x60s" },
      { name: "Mountain climbers", base: "3x40" },
      { name: "V-up", base: "3x12" },
      { name: "Hollow hold", base: "3x30s" },
    ],
    avanzado: [
      { name: "Plancha lagartija", base: "3x45s" },
      { name: "L-sit progresión", base: "4x20s" },
      { name: "Dragon flag negativos", base: "3x6" },
    ],
  },
}

const SPLITS: Record<3 | 4 | 5, string[]> = {
  3: ["Full body A", "Full body B", "Full body C"],
  4: ["Empuje", "Tirón", "Pierna", "Core"],
  5: ["Empuje", "Tirón", "Pierna", "Core", "Full body"],
}

const INFO_SEMANAS: Record<number, InfoSemana> = {
  1: { volumen: "Base · 3 series", descanso: "90s", nota: "Técnica perfecta. Sin llegar al fallo." },
  2: { volumen: "+1 serie · 4 series", descanso: "75s", nota: "Sobrecarga progresiva. Sube reps si ya dominas." },
  3: { volumen: "+1 rep/serie", descanso: "60s", nota: "Intensidad alta. Cerca del fallo." },
  4: { volumen: "Descarga · 2 series", descanso: "90s", nota: "Recuperación. Evalúa el mes." },
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function inferirNivel(freq: string | null | undefined): Nivel {
  if (!freq) return "principiante"
  if (freq === "5-6" || freq === "diario") return "avanzado"
  if (freq === "3-4") return "intermedio"
  return "principiante"
}

function inferirDias(freq: string | null | undefined): 3 | 4 | 5 {
  if (!freq) return 3
  if (freq === "5-6" || freq === "diario") return 5
  if (freq === "3-4") return 4
  return 3
}

function generarSesiones(nivel: Nivel, dias: 3 | 4 | 5, semana: number): Sesion[] {
  const split = SPLITS[dias]
  return split.map((foco) => {
    let ejercicios: EjercicioPlan[]
    if (foco.includes("Empuje")) ejercicios = EJERCICIOS_PLAN.empuje[nivel]
    else if (foco.includes("Tirón")) ejercicios = EJERCICIOS_PLAN.tiron[nivel]
    else if (foco.includes("Pierna")) ejercicios = EJERCICIOS_PLAN.pierna[nivel]
    else if (foco.includes("Core")) ejercicios = EJERCICIOS_PLAN.core[nivel]
    else {
      ejercicios = [
        ...EJERCICIOS_PLAN.empuje[nivel].slice(0, 2),
        ...EJERCICIOS_PLAN.tiron[nivel].slice(0, 2),
        ...EJERCICIOS_PLAN.pierna[nivel].slice(0, 1),
        ...EJERCICIOS_PLAN.core[nivel].slice(0, 1),
      ]
    }
    // apply progression
    return {
      foco,
      ejercicios: ejercicios.map((ex) => {
        let sets = ex.base
        if (semana === 2) sets = sets.replace(/^(\d+)x/, (_, n) => `${parseInt(n) + 1}x`)
        if (semana === 4) sets = sets.replace(/^(\d+)x/, (_, n) => `${Math.max(2, Math.round(parseInt(n) / 2))}x`)
        return { ...ex, base: sets }
      }),
    }
  })
}

const PLAN_KEY = "sapofit-plan4s-v1"
interface PlanState { semana: number; sesionesCompletadas: Record<string, boolean> }

function loadPlanState(): PlanState {
  try {
    return JSON.parse(window.localStorage.getItem(PLAN_KEY) || "null") ?? { semana: 1, sesionesCompletadas: {} }
  } catch { return { semana: 1, sesionesCompletadas: {} } }
}
function savePlanState(s: PlanState) {
  window.localStorage.setItem(PLAN_KEY, JSON.stringify(s))
}

// ─── componente plan 4 semanas ────────────────────────────────────────────────
function PlanSemanasSection({ profile }: { profile: ProfileData | null }) {
  const nivel = inferirNivel(profile?.trainingFrequency)
  const dias = inferirDias(profile?.trainingFrequency)
  const [planState, setPlanState] = useState<PlanState>({ semana: 1, sesionesCompletadas: {} })
  const [expandida, setExpandida] = useState<string | null>(null)

  useEffect(() => { setPlanState(loadPlanState()) }, [])

  const { semana, sesionesCompletadas } = planState
  const info = INFO_SEMANAS[semana]
  const sesiones = generarSesiones(nivel, dias, semana)

  const completadas = sesiones.filter((s) => sesionesCompletadas[`${semana}-${s.foco}`]).length
  const porcentaje = Math.round((completadas / sesiones.length) * 100)

  const toggleSesion = useCallback((foco: string) => {
    const key = `${semana}-${foco}`
    const next: PlanState = {
      ...planState,
      sesionesCompletadas: {
        ...planState.sesionesCompletadas,
        [key]: !planState.sesionesCompletadas[key],
      },
    }
    setPlanState(next)
    savePlanState(next)
  }, [planState, semana])

  const cambiarSemana = (delta: number) => {
    const next: PlanState = { ...planState, semana: Math.min(4, Math.max(1, semana + delta)) }
    setPlanState(next)
    savePlanState(next)
  }

  const reiniciar = () => {
    const next: PlanState = { semana: 1, sesionesCompletadas: {} }
    setPlanState(next)
    savePlanState(next)
  }

  return (
    <div className="space-y-4">
      {/* Banner semana actual */}
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,_rgba(4,47,31,0.94),_rgba(5,150,105,0.75))] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Calendar className="h-3 w-3" /> Plan sin equipo · Nivel {nivel}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Semana {semana} / 4
              <span className="ml-3 text-base font-normal text-white/80">— {info.volumen}</span>
            </h2>
            <p className="mt-1.5 text-sm text-white/75">Descanso entre series: <strong className="text-white">{info.descanso}</strong> · {info.nota}</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={() => cambiarSemana(-1)}
              disabled={semana === 1}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={() => cambiarSemana(1)}
              disabled={semana === 4}
            >
              Siguiente
            </Button>
          </div>
        </div>
        {/* Progreso semana */}
        <div className="mt-4 rounded-[1.5rem] bg-white/10 p-4 backdrop-blur">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span>Progreso semana {semana}</span>
            <span>{completadas}/{sesiones.length} sesiones · {porcentaje}%</span>
          </div>
          <Progress value={porcentaje} className="bg-white/15 [&_[data-slot=progress-indicator]]:bg-emerald-400" />
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((s) => {
              const sc = Object.keys(planState.sesionesCompletadas).filter(k => k.startsWith(`${s}-`)).length
              return (
                <div key={s} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s === semana ? "bg-emerald-500 text-white" : "bg-white/10 text-white/70"}`}>
                  {sc > 0 && <CheckCircle2 className="h-3 w-3" />}
                  Sem {s}
                </div>
              )
            })}
            <button onClick={reiniciar} className="ml-auto flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/60 hover:bg-white/20">
              <RotateCcw className="h-3 w-3" /> Reiniciar
            </button>
          </div>
        </div>
      </section>

      {/* Sesiones */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sesiones.map((sesion, idx) => {
          const key = `${semana}-${sesion.foco}`
          const completada = !!sesionesCompletadas[key]
          const abierta = expandida === key

          return (
            <Card key={`${sesion.foco}-${idx}`} className={`rounded-[1.75rem] shadow-sm transition-all ${completada ? "border-emerald-300 bg-[linear-gradient(135deg,_rgba(16,185,129,0.06),_rgba(255,255,255,0.95))]" : "border-white/70 bg-white/85"}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSesion(sesion.foco)}
                    className="flex-shrink-0 transition-transform active:scale-90"
                  >
                    {completada
                      ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      : <Circle className="h-6 w-6 text-muted-foreground" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{sesion.foco}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">{sesion.ejercicios.length} ejerc.</Badge>
                        <button
                          onClick={() => setExpandida(abierta ? null : key)}
                          className="rounded-full p-1 text-muted-foreground hover:bg-muted/50"
                        >
                          {abierta ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sesion.foco.includes("Full") ? "Empuje · Tirón · Pierna · Core" :
                        sesion.foco === "Empuje" ? "Pecho · Hombros · Tríceps" :
                        sesion.foco === "Tirón" ? "Espalda · Bíceps · Posterior" :
                        sesion.foco === "Pierna" ? "Cuádriceps · Isquios · Glúteos" :
                        "Abdomen · Core · Estabilidad"}
                    </p>
                  </div>
                </div>

                {abierta && (
                  <div className="mt-4 space-y-1.5 border-t border-border/50 pt-3">
                    {sesion.ejercicios.map((ex, ei) => (
                      <div key={ei} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
                        <span className="text-foreground">{ex.name}</span>
                        <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs font-mono">{ex.base}</Badge>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      className="mt-2 w-full rounded-xl"
                      onClick={() => toggleSesion(sesion.foco)}
                    >
                      {completada ? "Marcar pendiente" : "Marcar completada"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Por qué funciona */}
      <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-amber-500" /> Por qué funciona este método
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Semanas 1-3:</span> sobrecarga progresiva — cada semana añades volumen o intensidad.</p>
          <p><span className="font-medium text-foreground">Semana 4:</span> descarga — 50% volumen, permite supercompensación y evita meseta.</p>
          <p><span className="font-medium text-foreground">Sin equipo:</span> usa progresiones de dificultad (ángulos, una extremidad, tempo 3s bajada).</p>
          <p><span className="font-medium text-foreground">Nivel {nivel}:</span> inferido de tu frecuencia de entrenamiento ({profile?.trainingFrequency ?? "no definida"}).</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── constantes offline (sesión de hoy) ──────────────────────────────────────
const OFFLINE_KEY = "sapofit-v3-offline-training"

// ─── página principal ─────────────────────────────────────────────────────────
export default function EntrenamientoPage() {
  const [tab, setTab] = useState<"hoy" | "plan">("hoy")
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [tracking, setTracking] = useState<ExerciseTracking[]>([])
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restExerciseName, setRestExerciseName] = useState("")
  const [profile, setProfile] = useState<ProfileData | null>(null)

  const loadOfflineQueue = () => {
    try { return JSON.parse(window.localStorage.getItem(OFFLINE_KEY) || "[]") as ExerciseTracking[] }
    catch { return [] }
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
          payload: { dateIso: new Date().toISOString(), exerciseId: item.exerciseId, completed: item.completed, durationSec: item.durationSec || 0 },
        }),
      })
    }
    saveOfflineQueue([])
  }

  useEffect(() => {
    const load = async () => {
      setOnline(navigator.onLine)
      await syncOfflineQueue()

      const [planRes, trackingRes, recsRes, profileRes] = await Promise.all([
        fetch("/api/plan"),
        fetch("/api/tracking"),
        fetch("/api/plan/recommendations?type=recommendations"),
        fetch("/api/profile"),
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
        setTracking((data.exerciseLogs || []).map((entry: Record<string, unknown>) => ({
          exerciseId: entry.exerciseId as string,
          completed: entry.completed as boolean,
          durationSec: entry.durationSec as number,
        })))
      }
      if (recsRes.ok) {
        const data = await recsRes.json()
        if (data.recommendation) setRecommendations({ recommendation: data.recommendation, precautions: data.precautions || [] })
      }
      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile ?? null)
      }

      setLoading(false)
    }

    const handleOnline = async () => { setOnline(true); await syncOfflineQueue() }
    const handleOffline = () => setOnline(false)

    load()
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline) }
  }, []) // eslint-disable-line

  const toggleExercise = async (idx: number) => {
    const exercise = exercises[idx]
    if (!exercise) return
    const exerciseId = exercise.id
    const current = tracking.find((item) => item.exerciseId === exerciseId)
    const next = { exerciseId, completed: !current?.completed, durationSec: exercise.duration || 0 }
    setTracking((prev) => {
      if (!prev.some((item) => item.exerciseId === exerciseId)) return [...prev, next]
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
        payload: { dateIso: new Date().toISOString(), exerciseId, completed: next.completed, durationSec: next.durationSec || 0 },
      }),
    })
  }

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) {
      if (restTimer === 0) { if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]); setRestTimer(null) }
      return
    }
    const id = setTimeout(() => setRestTimer((t) => (t ?? 1) - 1), 1000)
    return () => clearTimeout(id)
  }, [restTimer])

  const startRest = (seconds: number, name: string) => { setRestTimer(seconds); setRestExerciseName(name) }

  const completedCount = useMemo(() => tracking.filter((item) => item.completed).length, [tracking])
  const completion = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0
  const totalMinutes = Math.round(exercises.reduce((sum, item) => sum + ((item.duration || 0) / 60), 0))

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      {/* Header */}
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,_rgba(4,47,31,0.94),_rgba(5,150,105,0.75))] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Dumbbell className="h-3 w-3" /> Entrenamiento
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {tab === "hoy" ? "Sesión de hoy" : "Plan 4 semanas"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              {tab === "hoy"
                ? "Vista de circuito con timer de descanso. Los marcados se conservan sin WiFi."
                : "Progresión sin equipo adaptada a tu nivel y frecuencia."}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge className={online ? "bg-emerald-500 text-white" : "bg-amber-500 text-black"}>
              {online ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
              {online ? "Online" : "Offline"}
            </Badge>
            {tab === "hoy" && <Badge variant="secondary">{totalMinutes} min estimados</Badge>}
          </div>
        </div>

        {/* Tabs dentro del header */}
        <div className="mt-4 flex gap-2">
          {(["hoy", "plan"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === t ? "bg-white text-emerald-900" : "bg-white/15 text-white/80 hover:bg-white/25"}`}
            >
              {t === "hoy" ? "Sesión de hoy" : "Plan 4 semanas"}
            </button>
          ))}
        </div>
      </section>

      {/* ── TAB: SESIÓN DE HOY ── */}
      {tab === "hoy" && (
        <>
          {recommendations && (
            <Card className="rounded-[1.75rem] border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(80,200,120,0.08))] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> Recomendaciones personalizadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{recommendations.recommendation}</p>
                <div className="flex flex-wrap gap-2">
                  {recommendations.precautions.map((item) => (
                    <Badge key={item} variant="outline"><AlertTriangle className="mr-1 h-3 w-3" />{item}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {exercises.length === 0 ? (
            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
              <CardContent className="p-8 text-center">
                <Dumbbell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-medium text-muted-foreground">No tienes ejercicios asignados para hoy.</p>
                <p className="mt-2 text-sm text-muted-foreground">Genera un plan de nutrición y entreno, o usa el <button className="text-emerald-600 underline" onClick={() => setTab("plan")}>Plan 4 semanas</button>.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                {/* Barra progreso sesión */}
                <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">Progreso sesión</span>
                      <span>{completedCount}/{exercises.length} · {completion}%</span>
                    </div>
                    <Progress value={completion} className="[&_[data-slot=progress-indicator]]:bg-emerald-500" />
                  </CardContent>
                </Card>

                {exercises.map((exercise, idx) => {
                  const status = tracking.find((item) => item.exerciseId === exercise.id)
                  const completed = !!status?.completed
                  return (
                    <Card key={`${exercise.name}-${idx}`} className={`rounded-[1.75rem] shadow-sm transition-all ${completed ? "border-emerald-300 bg-[linear-gradient(135deg,_rgba(16,185,129,0.06),_rgba(255,255,255,0.95))]" : "border-white/70 bg-white/85"}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <button onClick={() => toggleExercise(idx)} className="mt-1 transition-transform active:scale-90">
                            {completed
                              ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                              : <Circle className="h-6 w-6 text-muted-foreground" />
                            }
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
                              <Button variant="outline" size="sm" onClick={() => toggleExercise(idx)}>
                                {completed ? "Pendiente" : "Completar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="space-y-4">
                <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Resumen de sesión</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-semibold">{completedCount}</p><p className="text-muted-foreground">Hechos</p></div>
                    <div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-semibold">{completion}%</p><p className="text-muted-foreground">Avance</p></div>
                    <div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-semibold">{totalMinutes}</p><p className="text-muted-foreground">Minutos</p></div>
                  </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Modo offline listo</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Si entrenas sin cobertura, los cambios se guardan localmente y se sincronizan al reconectar.</p>
                    <button className="text-emerald-600 text-xs underline" onClick={() => setTab("plan")}>
                      Ver plan estructurado 4 semanas →
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB: PLAN 4 SEMANAS ── */}
      {tab === "plan" && <PlanSemanasSection profile={profile} />}

      {/* Timer descanso flotante */}
      {restTimer !== null && (
        <div className="fixed bottom-20 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
          <div className="flex items-center gap-4 rounded-[1.75rem] bg-gray-900 p-4 shadow-2xl text-white">
            <div className="relative flex-shrink-0">
              {(() => {
                const total = 90; const r = 24; const circ = 2 * Math.PI * r
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
