"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface WorkoutExercise {
  id: string
  order: number
  plannedSets: number
  plannedReps: number
  gymMachine: {
    id: string
    machineModel: {
      id: string
      name: string
      description?: string
      instructions?: string
      tips?: string
      recommendedWeight?: number
    }
  }
  workoutSets: {
    id: string
    setNumber: number
    weight: number
    reps: number
  }[]
}

interface WorkoutSession {
  id: string
}

interface MaquinasSectionProps {
  sessionId: string
}

export function MaquinasSection({ sessionId }: MaquinasSectionProps) {
  const [group, setGroup] = useState<"UPPER" | "LOWER">("UPPER")
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weights, setWeights] = useState<Record<string, Record<number, string>>>({})
  const [selectedMachineInfo, setSelectedMachineInfo] = useState<WorkoutExercise["gymMachine"]["machineModel"] | null>(null)
  const [savingSet, setSavingSet] = useState<string | null>(null)

  useEffect(() => {
    loadExercises()
  }, [group])

  async function loadExercises() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/user/workout/current?group=${group}`)
      const data = await res.json()
      if (data.ok) {
        setExercises(data.exercises)
        const initialWeights: Record<string, Record<number, string>> = {}
        data.exercises.forEach((ex: WorkoutExercise) => {
          initialWeights[ex.id] = {}
          for (let i = 1; i <= ex.plannedSets; i++) {
            const existing = ex.workoutSets.find((s) => s.setNumber === i)
            initialWeights[ex.id][i] = existing?.weight.toString() || ""
          }
        })
        setWeights(initialWeights)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("Error cargando ejercicios")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSet(exerciseId: string, setNumber: number) {
    const weight = weights[exerciseId]?.[setNumber]
    if (!weight) {
      setError("Ingresa el peso")
      return
    }

    setSavingSet(`${exerciseId}-${setNumber}`)
    try {
      const res = await fetch(
        `/api/user/workout/exercise/${exerciseId}/set`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workoutSessionId: sessionId,
            setNumber,
            weight: parseFloat(weight),
            reps: 12,
          }),
        }
      )
      if (res.ok) {
        setError(null)
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch (err) {
      setError("Error guardando serie")
    } finally {
      setSavingSet(null)
    }
  }

  async function handleEndSession() {
    try {
      const res = await fetch("/api/user/workout/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (res.ok) {
        alert("Sesión completada")
        setExercises([])
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch (err) {
      setError("Error completando sesión")
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selector de grupo */}
      <div className="flex gap-2">
        <Button
          variant={group === "UPPER" ? "default" : "outline"}
          onClick={() => setGroup("UPPER")}
          className="flex-1"
        >
          Tren Superior
        </Button>
        <Button
          variant={group === "LOWER" ? "default" : "outline"}
          onClick={() => setGroup("LOWER")}
          className="flex-1"
        >
          Tren Inferior
        </Button>
      </div>

      {/* Lista de máquinas */}
      {loading ? (
        <Card className="p-6 text-center text-muted-foreground">Cargando...</Card>
      ) : exercises.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No hay máquinas para este grupo
        </Card>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <Card key={ex.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{ex.gymMachine.machineModel.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {ex.plannedSets}×{ex.plannedReps}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedMachineInfo(
                      selectedMachineInfo?.id === ex.gymMachine.machineModel.id
                        ? null
                        : ex.gymMachine.machineModel
                    )
                  }
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>

              {/* Info máquina */}
              {selectedMachineInfo?.id === ex.gymMachine.machineModel.id && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-2">
                  {selectedMachineInfo.description && (
                    <p>
                      <strong>Qué es:</strong> {selectedMachineInfo.description}
                    </p>
                  )}
                  {selectedMachineInfo.instructions && (
                    <p>
                      <strong>Cómo usar:</strong> {selectedMachineInfo.instructions}
                    </p>
                  )}
                  {selectedMachineInfo.tips && (
                    <p>
                      <strong>Recomendaciones:</strong> {selectedMachineInfo.tips}
                    </p>
                  )}
                  {selectedMachineInfo.recommendedWeight && (
                    <p className="text-blue-700 font-semibold">
                      Peso recomendado: {selectedMachineInfo.recommendedWeight} kg
                    </p>
                  )}
                </div>
              )}

              {/* Inputs de peso */}
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: ex.plannedSets }, (_, i) => i + 1).map(
                  (setNum) => (
                    <div key={`${ex.id}-${setNum}`} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Serie {setNum}
                      </label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          placeholder="kg"
                          value={weights[ex.id]?.[setNum] || ""}
                          onChange={(e) =>
                            setWeights({
                              ...weights,
                              [ex.id]: {
                                ...(weights[ex.id] || {}),
                                [setNum]: e.target.value,
                              },
                            })
                          }
                          className="h-8"
                          disabled={savingSet === `${ex.id}-${setNum}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveSet(ex.id, setNum)}
                          disabled={savingSet === `${ex.id}-${setNum}`}
                          className="h-8 px-2"
                        >
                          {savingSet === `${ex.id}-${setNum}` ? "..." : "OK"}
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {exercises.length > 0 && (
        <Button
          onClick={handleEndSession}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          Terminar sesión
        </Button>
      )}
    </div>
  )
}
