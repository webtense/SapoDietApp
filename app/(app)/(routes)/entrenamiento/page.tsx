"use client"

import { useEffect, useState } from "react"
import { Dumbbell, CheckCircle2, Circle, Clock, Lightbulb, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Exercise {
  name: string
  categoria?: string
  sets?: number
  reps?: number
  duration?: number
  rest?: number
  muscleGroups?: string[]
  equipment?: string[]
  dificultad?: string
  instrucciones?: string[]
}

interface ExerciseTracking {
  id: string
  ejercicio: string
  completado: boolean
  sets?: any[]
  duracionTotal?: number
}

interface Recommendations {
  recommendation: string
  exercises: Exercise[]
  precautions: string[]
}

export default function EntrenamientoPage() {
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [tracking, setTracking] = useState<ExerciseTracking[]>([])
  const [selectedDay, setSelectedDay] = useState<string>("Hoy")
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null)

  useEffect(() => {
    const load = async () => {
      const [planRes, trackingRes, recsRes] = await Promise.all([
        fetch("/api/plan"),
        fetch("/api/tracking"),
        fetch("/api/plan?type=recommendations"),
      ])

      if (planRes.ok) {
        const data = await planRes.json()
        if (data.plan?.planJson) {
          const parsed = JSON.parse(data.plan.planJson)
          setExercises(parsed.exercisePlan || [])
        }
      }

      if (trackingRes.ok) {
        const t = await trackingRes.json()
        if (t.exerciseLogs) {
          setTracking(t.exerciseLogs.map((e: any) => ({
            id: e.id,
            ejercicio: e.exerciseId,
            completado: e.completed,
            sets: e.setsJson ? JSON.parse(e.setsJson) : [],
            duracionTotal: e.durationSec,
          })))
        }
      }

      if (recsRes.ok) {
        const r = await recsRes.json()
        if (r.recommendation) {
          setRecommendations(r)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleExercise = async (idx: number, completado: boolean) => {
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "exercise",
        payload: {
          dateIso: new Date().toISOString(),
          exerciseId: String(idx),
          completed: !completado,
        },
      }),
    })
    setTracking(prev => prev.map((t, i) => 
      i === idx ? { ...t, completado: !completado } : t
    ))
  }

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  const today = new Date().getDay()
  const dayMap = [6, 0, 1, 2, 3, 4, 5]

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Entrenamiento</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Día de entrenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day, idx) => {
              const isToday = dayMap[idx] === today
              const isCompleted = exercises.filter((_, i) => tracking[i]?.completado).length
              const total = exercises.length
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${selectedDay === day 
                      ? "bg-emerald-500 text-white" 
                      : isToday 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-muted text-muted-foreground"}`}
                >
                  {day}
                  {isToday && <span className="block text-xs opacity-75">Hoy</span>}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {recommendations && (
        <>
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Recomendaciones personalizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{recommendations.recommendation}</p>
              {recommendations.precautions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recommendations.precautions.map((p, i) => (
                    <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No tienes ejercicios asignados</p>
            <a href="/perfil" className="text-emerald-600 hover:underline">Configurar en perfil</a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, idx) => {
            const track = tracking[idx]
            const isCompleted = track?.completado || false
            
            return (
              <Card key={idx} className={isCompleted ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleExercise(idx, isCompleted)}
                      className="mt-1"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{exercise.name}</h3>
                        {exercise.muscleGroups && (
                          <Badge variant="secondary" className="text-xs">
                            {exercise.muscleGroups[0]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {exercise.sets && (
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3 w-3" />
                            {exercise.sets} series
                          </span>
                        )}
                        {exercise.reps && (
                          <span>{exercise.reps} repes</span>
                        )}
                        {exercise.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {exercise.duration}s
                          </span>
                        )}
                        {exercise.rest && (
                          <span className="text-xs">Descanso: {exercise.rest}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen semanal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{tracking.filter(t => t.completado).length}/{exercises.length}</p>
            <p className="text-xs text-muted-foreground">Ejercicios hechos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {exercises.length > 0 
                ? Math.round((tracking.filter(t => t.completado).length / exercises.length) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Completado</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {Math.round(tracking.reduce((sum, t) => sum + (t.duracionTotal || 0), 0) / 60) || 0}
            </p>
            <p className="text-xs text-muted-foreground">Minutos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}