"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface OnboardingData {
  // Datos básicos
  weight: number
  height: number
  age: number
  sex: "M" | "F"

  // Objetivo
  goalWeightKg: number
  goalDescription: string

  // Entrenamiento
  trainingFrequency: "1-2" | "3-4" | "5-6" | "7"
  trainingLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  preferredEquipment: string[]

  // Nutrición
  dietType: string
  avoidFoods: string
  mealsPerDay: number
}

const STEPS = [
  { title: "Datos básicos", description: "Peso, altura, edad" },
  { title: "Objetivo", description: "Meta de peso y descripción" },
  { title: "Entrenamiento", description: "Frecuencia y nivel" },
  { title: "Nutrición", description: "Tipo de dieta y restricciones" },
]

export function OnboardingFlowV2({ userName }: { userName: string }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    weight: 70,
    height: 170,
    age: 30,
    sex: "M",
    goalWeightKg: 65,
    goalDescription: "Perder grasa manteniendo músculo",
    trainingFrequency: "3-4",
    trainingLevel: "INTERMEDIATE",
    preferredEquipment: ["dumbbell", "barbell"],
    dietType: "Mediterranean",
    avoidFoods: "",
    mealsPerDay: 4,
  })

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          profileData: {
            weight: data.weight,
            height: data.height,
            age: data.age,
            sex: data.sex,
            onboardingCompleted: true,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error guardando onboarding")
      }

      toast.success("¡Onboarding completado!")
      router.push("/Hoy")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {userName}</h1>
          <p className="mt-2 text-gray-600">Vamos a configurar tu perfil en 4 pasos</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-sm text-gray-600 text-center">
            Paso {currentStep + 1} de {STEPS.length}
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 rounded-lg p-3 text-center transition-colors",
                idx <= currentStep
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              <p className="text-xs font-medium">{step.title}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <p className="text-sm text-gray-600">{STEPS[currentStep].description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* STEP 0: Datos básicos */}
            {currentStep === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      value={data.weight}
                      onChange={(e) =>
                        setData({ ...data, weight: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      value={data.height}
                      onChange={(e) =>
                        setData({ ...data, height: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="170"
                    />
                  </div>
                  <div>
                    <Label>Edad</Label>
                    <Input
                      type="number"
                      value={data.age}
                      onChange={(e) => setData({ ...data, age: parseInt(e.target.value) || 0 })}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label>Sexo</Label>
                    <select
                      value={data.sex}
                      onChange={(e) => setData({ ...data, sex: e.target.value as "M" | "F" })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="M">Hombre</option>
                      <option value="F">Mujer</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 1: Objetivo */}
            {currentStep === 1 && (
              <>
                <div>
                  <Label>Meta de peso (kg)</Label>
                  <Input
                    type="number"
                    value={data.goalWeightKg}
                    onChange={(e) =>
                      setData({ ...data, goalWeightKg: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="65"
                  />
                </div>
                <div>
                  <Label>Descripción del objetivo</Label>
                  <textarea
                    value={data.goalDescription}
                    onChange={(e) => setData({ ...data, goalDescription: e.target.value })}
                    placeholder="Ej: Perder grasa manteniendo músculo"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* STEP 2: Entrenamiento */}
            {currentStep === 2 && (
              <>
                <div>
                  <Label>Frecuencia de entrenamiento</Label>
                  <select
                    value={data.trainingFrequency}
                    onChange={(e) =>
                      setData({
                        ...data,
                        trainingFrequency: e.target.value as "1-2" | "3-4" | "5-6" | "7",
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="1-2">1-2 días/semana</option>
                    <option value="3-4">3-4 días/semana</option>
                    <option value="5-6">5-6 días/semana</option>
                    <option value="7">7 días/semana</option>
                  </select>
                </div>
                <div>
                  <Label>Nivel de entrenamiento</Label>
                  <select
                    value={data.trainingLevel}
                    onChange={(e) =>
                      setData({
                        ...data,
                        trainingLevel: e.target.value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                  </select>
                </div>
              </>
            )}

            {/* STEP 3: Nutrición */}
            {currentStep === 3 && (
              <>
                <div>
                  <Label>Tipo de dieta</Label>
                  <select
                    value={data.dietType}
                    onChange={(e) => setData({ ...data, dietType: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="Mediterranean">Mediterránea</option>
                    <option value="HighProtein">Alta en proteínas</option>
                    <option value="LowCarb">Baja en carbohidratos</option>
                    <option value="Vegan">Vegana</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <Label>Alimentos a evitar (opcional)</Label>
                  <Input
                    value={data.avoidFoods}
                    onChange={(e) => setData({ ...data, avoidFoods: e.target.value })}
                    placeholder="Ej: lactosa, gluten, mariscos"
                  />
                </div>
                <div>
                  <Label>Comidas por día</Label>
                  <select
                    value={data.mealsPerDay}
                    onChange={(e) => setData({ ...data, mealsPerDay: parseInt(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="3">3 comidas</option>
                    <option value="4">4 comidas</option>
                    <option value="5">5 comidas</option>
                    <option value="6">6 comidas</option>
                  </select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0 || loading}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={loading}
              className="flex-1"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  ¡Empezar!
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
