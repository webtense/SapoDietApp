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
import { Info, Pencil } from "lucide-react"
import Link from "next/link"

type Group = "UPPER" | "LOWER"

interface MachineModelInfo {
  id: string
  name: string
  description: string | null
  instructions: string | null
  tips: string | null
  recommendedWeight: number | null
}

interface WorkoutSetItem {
  id: string
  setNumber: number
  weight: number
  reps: number
}

interface WorkoutExerciseItem {
  id: string
  order: number
  plannedSets: number
  plannedReps: number
  plannedWeight: number | null
  exercise: { id: string; name: string }
  gymMachine: { id: string; machineModel: MachineModelInfo } | null
  workoutSets: WorkoutSetItem[]
}

interface CurrentWorkoutResponse {
  ok: boolean
  needsGym?: boolean
  session: { id: string; completedAt: string | null }
  plan: { id: string; planType: Group } | null
  exercises: WorkoutExerciseItem[]
}

interface SetDraft {
  weight: string
  reps: string
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

const GROUP_LABEL: Record<Group, string> = { UPPER: "Tren Superior", LOWER: "Tren Inferior" }

export default function EntrenamientoPage() {
  const [tab, setTab] = useState<ViewTab>("entrenar")
  const [group, setGroup] = useState<Group>("UPPER")
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<CurrentWorkoutResponse | null>(null)
  const [drafts, setDrafts] = useState<Record<string, SetDraft[]>>({})
  const [savedSets, setSavedSets] = useState<Record<string, boolean>>({})
  const [editingSets, setEditingSets] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  const [infoMachine, setInfoMachine] = useState<string | null>(null)

  const [selectedProgressionExercise, setSelectedProgressionExercise] = useState<string | null>(null)
  const [progression, setProgression] = useState<ExerciseProgressionSession[]>([])
  const [progressionLoading, setProgressionLoading] = useState(false)

  const loadCurrent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/workout/current?group=${group}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el entrenamiento")
      const payload = data as CurrentWorkoutResponse
      setCurrent(payload)

      const nextDrafts: Record<string, SetDraft[]> = {}
      const nextSaved: Record<string, boolean> = {}
      for (const we of payload.exercises) {
        nextDrafts[we.id] = Array.from({ length: we.plannedSets }, (_, idx) => {
          const existing = we.workoutSets.find((s) => s.setNumber === idx + 1)
          if (existing) nextSaved[`${we.id}-${idx}`] = true
          return { weight: existing ? String(existing.weight) : "", reps: existing ? String(existing.reps) : "" }
        })
      }
      setDrafts(nextDrafts)
      setSavedSets(nextSaved)
      setEditingSets({})

      setSelectedProgressionExercise((prev) => {
        if (prev && payload.exercises.some((we) => we.exercise.id === prev)) return prev
        return payload.exercises[0]?.exercise.id ?? null
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando entrenamiento")
    } finally {
      setLoading(false)
    }
  }, [group])

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

  function updateDraft(workoutExerciseId: string, setIndex: number, field: keyof SetDraft, value: string) {
    setDrafts((prev) => {
      const list = [...(prev[workoutExerciseId] ?? [])]
      list[setIndex] = { ...list[setIndex], [field]: value }
      return { ...prev, [workoutExerciseId]: list }
    })
  }

  function handleEditSet(workoutExerciseId: string, setIndex: number) {
    setEditingSets((prev) => ({ ...prev, [`${workoutExerciseId}-${setIndex}`]: true }))
  }

  async function handleSaveSet(we: WorkoutExerciseItem, setIndex: number) {
    if (!current) return
    const draft = drafts[we.id]?.[setIndex]
    if (!draft) return
    const weight = Number(draft.weight)
    if (!draft.weight || !(weight > 0)) {
      toast.error("Indica el peso en kg")
      return
    }
    const reps = draft.reps ? Number(draft.reps) : we.plannedReps

    const key = `${we.id}-${setIndex}`
    setSaving(key)
    try {
      const res = await fetch(`/api/user/workout/exercise/${we.id}/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutSessionId: current.session.id,
          setNumber: setIndex + 1,
          weight,
          reps,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la serie")
      toast.success(`Serie ${setIndex + 1} guardada`)
      setDrafts((prev) => {
        const list = [...(prev[we.id] ?? [])]
        list[setIndex] = { weight: String(weight), reps: String(reps) }
        return { ...prev, [we.id]: list }
      })
      setSavedSets((prev) => ({ ...prev, [key]: true }))
      setEditingSets((prev) => ({ ...prev, [key]: false }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando la serie")
    } finally {
      setSaving(null)
    }
  }

  async function handleEndSession() {
    if (!current) return
    setEnding(true)
    try {
      const res = await fetch("/api/user/workout/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: current.session.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo finalizar la sesión")
      toast.success("Sesión finalizada")
      loadCurrent()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error finalizando sesión")
    } finally {
      setEnding(false)
    }
  }

  const exercises = current?.exercises ?? []
  const savedCount = Object.values(savedSets).filter(Boolean).length

  const progressionChartData = progression.map((s) => ({
    date: new Date(s.date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
    oneRM: s.best1RM != null ? Number(s.best1RM.toFixed(1)) : null,
    pesoMax: s.sets.reduce((max, set) => (set.weight != null && set.weight > max ? set.weight : max), 0) || null,
  }))

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="flex gap-2">
        {(["entrenar", "progresion"] as ViewTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {t === "entrenar" ? "Entrenar" : "Progresión"}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(["UPPER", "LOWER"] as Group[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              group === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {GROUP_LABEL[g]}
          </button>
        ))}
      </div>

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Cargando entrenamiento…</p>}

      {!loading && current?.needsGym && (
        <Card>
          <CardContent className="space-y-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">No tienes gimnasio activo.</p>
            <Link href="/gimnasios">
              <Button size="sm">Elegir gimnasio</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && !current?.needsGym && tab === "entrenar" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{GROUP_LABEL[group]}</h1>
              <Badge variant="secondary">
                {exercises.length} máquinas · {savedCount} series hoy
              </Badge>
            </div>
            {exercises.length > 0 && (
              <Button size="sm" onClick={handleEndSession} disabled={ending || savedCount === 0}>
                Finalizar sesión
              </Button>
            )}
          </div>

          {exercises.length === 0 && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No hay máquinas activas para {GROUP_LABEL[group].toLowerCase()}. Un administrador puede añadirlas en
                Admin → Máquinas.
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {exercises.map((we) => {
              const model = we.gymMachine?.machineModel
              const name = model?.name ?? we.exercise.name
              const showInfo = model && infoMachine === model.id
              return (
                <Card key={we.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{name}</span>
                      <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                        {we.plannedSets}x{we.plannedReps}
                        {model?.recommendedWeight ? ` · ${model.recommendedWeight}kg` : ""}
                        {model && (model.description || model.instructions || model.tips) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Información de la máquina"
                            onClick={() => setInfoMachine(showInfo ? null : model.id)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        )}
                      </span>
                    </CardTitle>
                    {showInfo && model && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm space-y-1">
                        {model.description && <p><strong>Qué es:</strong> {model.description}</p>}
                        {model.instructions && <p><strong>Cómo usar:</strong> {model.instructions}</p>}
                        {model.tips && <p><strong>Recomendaciones:</strong> {model.tips}</p>}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(drafts[we.id] ?? []).map((draft, idx) => {
                      const key = `${we.id}-${idx}`
                      const isSaved = savedSets[key]
                      const isEditing = editingSets[key] ?? !isSaved

                      if (isSaved && !isEditing) {
                        return (
                          <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                            <span className="text-muted-foreground">Serie {idx + 1}</span>
                            <span className="font-medium">
                              {draft.weight || "-"} kg × {draft.reps || "-"} reps
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => handleEditSet(we.id, idx)}>
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
                              inputMode="decimal"
                              value={draft.weight}
                              onChange={(e) => updateDraft(we.id, idx, "weight", e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Reps</Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder={String(we.plannedReps)}
                              value={draft.reps}
                              onChange={(e) => updateDraft(we.id, idx, "reps", e.target.value)}
                            />
                          </div>
                          <Button size="sm" variant="outline" disabled={saving === key} onClick={() => handleSaveSet(we, idx)}>
                            {saving === key ? "…" : "Guardar"}
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

      {!loading && !current?.needsGym && tab === "progresion" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {exercises.map((we) => (
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
                {we.gymMachine?.machineModel.name ?? we.exercise.name}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {exercises.find((we) => we.exercise.id === selectedProgressionExercise)?.gymMachine?.machineModel.name ??
                  "Selecciona una máquina"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressionLoading && <p className="text-sm text-muted-foreground">Cargando progresión…</p>}
              {!progressionLoading && progressionChartData.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay series completadas registradas para esta máquina.
                </p>
              )}
              {!progressionLoading && progressionChartData.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressionChartData}>
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis domain={["auto", "auto"]} fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="oneRM" name="1RM estimado (kg)" stroke="var(--color-primary)" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="pesoMax" name="Peso máx. serie (kg)" stroke="var(--color-info)" strokeWidth={2} dot />
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
