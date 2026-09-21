"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export default function EntrenamientoPage() {
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<CurrentWorkoutResponse | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastByExercise, setLastByExercise] = useState<Record<string, LastSetInfo | null>>({})
  const [drafts, setDrafts] = useState<Record<string, SetDraft[]>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)

  const loadCurrent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/workout/current")
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
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando entrenamiento")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrent()
  }, [loadCurrent])

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
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
    </div>
  )
}
