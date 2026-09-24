"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Pencil } from "lucide-react"

interface ExerciseInfo {
  id: string
  name: string
}
interface GymMachineInfo {
  id: string
  assetNumber: string | null
}
interface WorkoutExerciseItem {
  id: string
  order: number
  plannedSets: number
  plannedReps: number
  plannedWeight: number | null
  exercise: ExerciseInfo
  gymMachine: GymMachineInfo | null
}
interface WorkoutPlanData {
  id: string
  name: string
  planType: "A" | "B" | "C"
  exercises: WorkoutExerciseItem[]
}
interface CurrentWorkoutResponse {
  ok: boolean
  planType: "A" | "B" | "C"
  plan: WorkoutPlanData | null
}
interface LastSetInfo {
  weight: number | null
  reps: number | null
}
interface SetDraft {
  weight: string
  reps: string
  rir: string
}

interface ExerciseProgressionSetPoint {
  setNumber: number
  weight: number | null
  reps: number | null
}
interface ExerciseProgressionSession {
  date: string
  sessionId: string
  sets: ExerciseProgressionSetPoint[]
  best1RM: number | null
}

type ViewTab = "entrenar" | "progresion"

export default function EntrenamientoPage() {
  const [tab, setTab] = useState<ViewTab>("entrenar")
  const [group, setGroup] = useState<"UPPER" | "LOWER">("UPPER")
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<CurrentWorkoutResponse | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastByExercise, setLastByExercise] = useState<Record<string, LastSetInfo | null>>({})
  const [drafts, setDrafts] = useState<Record<string, SetDraft[]>>({})
  const [savedSets, setSavedSets] = useState<Record<string, boolean>>({})
  const [editingSets, setEditingSets] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)

  const [selectedProgressionExercise, setSelectedProgressionExercise] = useState<string | null>(null)
  const [progression, setProgression] = useState<ExerciseProgressionSession[]>([])
  const [progressionLoading, setProgressionLoading] = useState(false)

  const loadCurrent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/workout/current?group=${group}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el entrenamiento")
      setCurrent(data)

      if (data.plan) {
        const nextDrafts: Record<string, SetDraft[]> = {}
        for (const we of data.plan.exercises as WorkoutExerciseItem[]) {
          nextDrafts[we.id] = Array.from({ length: we.plannedSets }, () => ({
            weight: "",
            reps: "",
            rir: "",
          }))

          fetch(`/api/user/workout/last/${we.exercise.id}`)
            .then((r) => r.json())
            .then((d) => {
              setLastByExercise((prev) => ({ ...prev, [we.exercise.id]: d.last }))
            })
            .catch(() => null)
        }
        setDrafts(nextDrafts)
        setSavedSets({})
        setEditingSets({})

        if (!selectedProgressionExercise && data.plan.exercises.length > 0) {
          setSelectedProgressionExercise(data.plan.exercises[0].exercise.id)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando entrenamiento")
    } finally {
      setLoading(false)
    }
  }, [selectedProgressionExercise])

  useEffect(() => {
    loadCurrent()
  }, [loadCurrent])

  const loadProgression = useCallback(async (exerciseId: string) => {
    setProgressionLoading(true)
    try {
      const res = await fetch(`/api/user/workout/exercise/${exerciseId}/progression`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar la progresión")
      setProgression(data.progression ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando la progresión")
      setProgression([])
    } finally {
      setProgressionLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === "progresion" && selectedProgressionExercise) {
      loadProgression(selectedProgressionExercise)
    }
  }, [tab, selectedProgressionExercise, loadProgression])

  async function handleStart(mode: "planned" | "free" | "skip") {
    try {
      const res = await fetch("/api/user/workout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, workoutPlanId: current?.plan?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar la sesión")

      if (mode === "skip") {
        toast.success("Entrenamiento saltado")
        loadCurrent()
        return
      }

      setSessionId(data.session.id)
      toast.success("Sesión iniciada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error iniciando sesión")
    }
  }

  function updateDraft(workoutExerciseId: string, setIndex: number, field: keyof SetDraft, value: string) {
    setDrafts((prev) => {
      const list = [...(prev[workoutExerciseId] ?? [])]
      list[setIndex] = { ...list[setIndex], [field]: value }
      return { ...prev, [workoutExerciseId]: list }
    })
  }

  function handleEditSet(workoutExerciseId: string, setIndex: number) {
    const key = `${workoutExerciseId}-${setIndex}`
    setEditingSets((prev) => ({ ...prev, [key]: true }))
  }

  async function handleSaveSet(workoutExerciseId: string, setIndex: number) {
    if (!sessionId) {
      toast.error("Primero inicia la sesión")
      return
    }
    const draft = drafts[workoutExerciseId]?.[setIndex]
    if (!draft) return

    const key = `${workoutExerciseId}-${setIndex}`
    setSaving(key)
    try {
      const res = await fetch(`/api/user/workout/exercise/${workoutExerciseId}/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutSessionId: sessionId,
          workoutExerciseId,
          setNumber: setIndex + 1,
          weight: draft.weight ? Number(draft.weight) : undefined,
          reps: draft.reps ? Number(draft.reps) : undefined,
          rir: draft.rir ? Number(draft.rir) : undefined,
          completed: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la serie")
      toast.success(`Serie ${setIndex + 1} guardada`)
      setSavedSets((prev) => ({ ...prev, [key]: true }))
      setEditingSets((prev) => ({ ...prev, [key]: false }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando la serie")
    } finally {
      setSaving(null)
    }
  }

  async function handleEndSession(completionStatus: "COMPLETED" | "PARTIAL") {
    if (!sessionId) return
    setEnding(true)
    try {
      const res = await fetch("/api/user/workout/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutSessionId: sessionId, completionStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo finalizar la sesión")
      toast.success("Sesión finalizada")
      setSessionId(null)
      loadCurrent()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error finalizando sesión")
    } finally {
      setEnding(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        Cargando entrenamiento…
      </div>
    )
  }

  if (!current?.plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sin plan de entrenamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Todavía no tienes un plan de entrenamiento asignado (toca {current?.planType}). Contacta con tu
              entrenador o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const plan = current.plan

  const progressionChartData = progression.map((s) => ({
    date: new Date(s.date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
    oneRM: s.best1RM != null ? Number(s.best1RM.toFixed(1)) : null,
    pesoMax: s.sets.reduce((max, set) => (set.weight != null && set.weight > max ? set.weight : max), 0) || null,
  }))

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("entrenar")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "entrenar" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          Entrenar
        </button>
        <button
          type="button"
          onClick={() => setTab("progresion")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "progresion" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          Progresión
        </button>
      </div>

      {tab === "entrenar" && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setGroup("UPPER")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                group === "UPPER" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              Tren Superior
            </button>
            <button
              type="button"
              onClick={() => setGroup("LOWER")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                group === "LOWER" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              Tren Inferior
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{plan.name}</h1>
              <Badge variant="secondary">Plan {plan.planType}</Badge>
            </div>
            {!sessionId ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleStart("planned")}>
                  Iniciar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStart("free")}>
                  Libre
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleStart("skip")}>
                  Saltar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEndSession("COMPLETED")} disabled={ending}>
                  Finalizar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEndSession("PARTIAL")} disabled={ending}>
                  Finalizar parcial
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {plan.exercises.map((we) => {
              const last = lastByExercise[we.exercise.id]
              return (
                <Card key={we.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{we.exercise.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {we.plannedSets}x{we.plannedReps}
                        {we.plannedWeight ? ` · ${we.plannedWeight}kg` : ""}
                      </span>
                    </CardTitle>
                    {last && (last.weight != null || last.reps != null) && (
                      <p className="text-xs text-muted-foreground">
                        Última vez: {last.weight ?? "-"} kg × {last.reps ?? "-"} reps
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(drafts[we.id] ?? []).map((draft, idx) => {
                      const key = `${we.id}-${idx}`
                      const isSaved = savedSets[key]
                      const isEditing = editingSets[key] ?? !isSaved

                      if (isSaved && !isEditing) {
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                          >
                            <span className="text-muted-foreground">Serie {idx + 1}</span>
                            <span className="font-medium">
                              {draft.weight || "-"} kg × {draft.reps || "-"} reps
                              {draft.rir ? ` · RIR ${draft.rir}` : ""}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSet(we.id, idx)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      }

                      return (
                        <div key={idx} className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Serie {idx + 1} — kg</Label>
                            <Input
                              type="number"
                              value={draft.weight}
                              onChange={(e) => updateDraft(we.id, idx, "weight", e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Reps</Label>
                            <Input
                              type="number"
                              value={draft.reps}
                              onChange={(e) => updateDraft(we.id, idx, "reps", e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">RIR</Label>
                            <Input
                              type="number"
                              value={draft.rir}
                              onChange={(e) => updateDraft(we.id, idx, "rir", e.target.value)}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!sessionId || saving === key}
                            onClick={() => handleSaveSet(we.id, idx)}
                          >
                            Guardar
                          </Button>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {tab === "progresion" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {plan.exercises.map((we) => (
              <button
                key={we.id}
                type="button"
                onClick={() => setSelectedProgressionExercise(we.exercise.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  selectedProgressionExercise === we.exercise.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {we.exercise.name}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {plan.exercises.find((we) => we.exercise.id === selectedProgressionExercise)?.exercise.name ??
                  "Selecciona un ejercicio"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressionLoading && (
                <p className="text-sm text-muted-foreground">Cargando progresión…</p>
              )}
              {!progressionLoading && progressionChartData.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay series completadas registradas para este ejercicio.
                </p>
              )}
              {!progressionLoading && progressionChartData.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressionChartData}>
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis domain={["auto", "auto"]} fontSize={11} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="oneRM"
                        name="1RM estimado (kg)"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot
                      />
                      <Line
                        type="monotone"
                        dataKey="pesoMax"
                        name="Peso máx. serie (kg)"
                        stroke="var(--color-info)"
                        strokeWidth={2}
                        dot
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
