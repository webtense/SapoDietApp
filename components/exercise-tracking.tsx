"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Plus, Minus, Play, Pause, RotateCcw, Trophy, Timer } from "lucide-react"
import type { Exercise, ExerciseTracking, ExerciseSet } from "@/lib/tracking-system"

interface ExerciseTrackingProps {
  exercises: Exercise[]
  exerciseTracking: ExerciseTracking[]
  onUpdateTracking: (tracking: ExerciseTracking) => void
}

export function ExerciseTrackingComponent({ exercises, exerciseTracking, onUpdateTracking }: ExerciseTrackingProps) {
  const [ejercicioActivo, setEjercicioActivo] = useState<string | null>(null)
  const [tiempoEntrenamiento, setTiempoEntrenamiento] = useState(0)
  const [entrenandoActivo, setEntrenandoActivo] = useState(false)
  const [intervalTimer, setIntervalTimer] = useState<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalTimer) {
        clearInterval(intervalTimer)
      }
    }
  }, [intervalTimer])

  const obtenerTracking = (ejercicioId: string): ExerciseTracking => {
    return (
      exerciseTracking.find((t) => t.ejercicio === ejercicioId) || {
        id: ejercicioId,
        fecha: new Date(),
        ejercicio: ejercicioId,
        sets: [],
        completado: false,
        duracionTotal: 0,
      }
    )
  }

  const iniciarPausarTimer = () => {
    if (entrenandoActivo) {
      // Pausar
      if (intervalTimer) {
        clearInterval(intervalTimer)
        setIntervalTimer(null)
      }
      setEntrenandoActivo(false)
    } else {
      // Iniciar
      const timer = setInterval(() => {
        setTiempoEntrenamiento((prev) => prev + 1)
      }, 1000)
      setIntervalTimer(timer)
      setEntrenandoActivo(true)
    }
  }

  const reiniciarTimer = () => {
    if (intervalTimer) {
      clearInterval(intervalTimer)
      setIntervalTimer(null)
    }
    setTiempoEntrenamiento(0)
    setEntrenandoActivo(false)
  }

  const formatearTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const agregarSet = (ejercicioId: string) => {
    const tracking = obtenerTracking(ejercicioId)
    const ejercicio = exercises.find((e) => e.id === ejercicioId)

    let nuevoSet: ExerciseSet = {}

    if (ejercicio?.tipoMedicion === "repeticiones") {
      nuevoSet = { repeticiones: 10, peso: 0 }
    } else if (ejercicio?.tipoMedicion === "tiempo") {
      nuevoSet = { tiempo: 30 }
    } else if (ejercicio?.tipoMedicion === "distancia") {
      nuevoSet = { distancia: 1000, tiempo: 300 }
    }

    const updatedTracking: ExerciseTracking = {
      ...tracking,
      sets: [...tracking.sets, nuevoSet],
    }

    onUpdateTracking(updatedTracking)
  }

  const actualizarSet = (ejercicioId: string, setIndex: number, campo: keyof ExerciseSet, valor: number) => {
    const tracking = obtenerTracking(ejercicioId)
    const nuevosSets = [...tracking.sets]
    nuevosSets[setIndex] = { ...nuevosSets[setIndex], [campo]: valor }

    const updatedTracking: ExerciseTracking = {
      ...tracking,
      sets: nuevosSets,
    }

    onUpdateTracking(updatedTracking)
  }

  const eliminarSet = (ejercicioId: string, setIndex: number) => {
    const tracking = obtenerTracking(ejercicioId)
    const nuevosSets = tracking.sets.filter((_, index) => index !== setIndex)

    const updatedTracking: ExerciseTracking = {
      ...tracking,
      sets: nuevosSets,
    }

    onUpdateTracking(updatedTracking)
  }

  const completarEjercicio = (ejercicioId: string) => {
    const tracking = obtenerTracking(ejercicioId)
    const updatedTracking: ExerciseTracking = {
      ...tracking,
      completado: !tracking.completado,
      duracionTotal: tiempoEntrenamiento,
    }

    onUpdateTracking(updatedTracking)
  }

  const ejerciciosCompletados = exerciseTracking.filter((t) => t.completado).length
  const totalEjercicios = exercises.length
  const progresoEjercicios = totalEjercicios > 0 ? (ejerciciosCompletados / totalEjercicios) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Timer de entrenamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Cronómetro de Entrenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">{formatearTiempo(tiempoEntrenamiento)}</div>
            <div className="flex gap-2 justify-center">
              <Button onClick={iniciarPausarTimer} variant={entrenandoActivo ? "secondary" : "default"}>
                {entrenandoActivo ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {entrenandoActivo ? "Pausar" : "Iniciar"}
              </Button>
              <Button onClick={reiniciarTimer} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progreso general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Progreso de Ejercicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ejercicios completados</span>
              <span>
                {ejerciciosCompletados} de {totalEjercicios}
              </span>
            </div>
            <Progress value={progresoEjercicios} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Lista de ejercicios */}
      <div className="space-y-4">
        {exercises.map((ejercicio) => {
          const tracking = obtenerTracking(ejercicio.id)
          const esActivo = ejercicioActivo === ejercicio.id

          return (
            <Card key={ejercicio.id} className={tracking.completado ? "bg-green-50 border-green-200" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{ejercicio.nombre}</div>
                    <div className="text-sm text-muted-foreground">
                      {ejercicio.categoria} • {ejercicio.dificultad}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ejercicio.equipamiento.join(", ")}</Badge>
                    {tracking.completado && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Completado
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">{ejercicio.descripcion}</div>

                {esActivo && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Instrucciones:</div>
                    <ol className="text-sm space-y-1 ml-4">
                      {ejercicio.instrucciones.map((instruccion, index) => (
                        <li key={index} className="list-decimal">
                          {instruccion}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Sets registrados */}
                {tracking.sets.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Sets registrados:</div>
                    {tracking.sets.map((set, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="text-sm font-medium">Set {index + 1}:</span>

                        {ejercicio.tipoMedicion === "repeticiones" && (
                          <>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={set.repeticiones || 0}
                                onChange={(e) =>
                                  actualizarSet(
                                    ejercicio.id,
                                    index,
                                    "repeticiones",
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="w-16 h-8"
                                min="0"
                              />
                              <span className="text-xs">reps</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={set.peso || 0}
                                onChange={(e) =>
                                  actualizarSet(ejercicio.id, index, "peso", Number.parseFloat(e.target.value) || 0)
                                }
                                className="w-16 h-8"
                                min="0"
                                step="0.5"
                              />
                              <span className="text-xs">kg</span>
                            </div>
                          </>
                        )}

                        {ejercicio.tipoMedicion === "tiempo" && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={set.tiempo || 0}
                              onChange={(e) =>
                                actualizarSet(ejercicio.id, index, "tiempo", Number.parseInt(e.target.value) || 0)
                              }
                              className="w-16 h-8"
                              min="0"
                            />
                            <span className="text-xs">seg</span>
                          </div>
                        )}

                        {ejercicio.tipoMedicion === "distancia" && (
                          <>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={set.distancia || 0}
                                onChange={(e) =>
                                  actualizarSet(ejercicio.id, index, "distancia", Number.parseInt(e.target.value) || 0)
                                }
                                className="w-20 h-8"
                                min="0"
                              />
                              <span className="text-xs">m</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={set.tiempo || 0}
                                onChange={(e) =>
                                  actualizarSet(ejercicio.id, index, "tiempo", Number.parseInt(e.target.value) || 0)
                                }
                                className="w-16 h-8"
                                min="0"
                              />
                              <span className="text-xs">seg</span>
                            </div>
                          </>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => eliminarSet(ejercicio.id, index)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEjercicioActivo(esActivo ? null : ejercicio.id)}
                  >
                    {esActivo ? "Ocultar" : "Ver detalles"}
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => agregarSet(ejercicio.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Set
                  </Button>

                  <Button
                    variant={tracking.completado ? "secondary" : "default"}
                    size="sm"
                    onClick={() => completarEjercicio(ejercicio.id)}
                    className="ml-auto"
                  >
                    {tracking.completado ? "Completado" : "Marcar completado"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
