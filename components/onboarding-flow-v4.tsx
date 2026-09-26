"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface GymSummary {
  id: string
  name: string
  location: string | null
  _count: { machines: number }
}

interface OnboardingData {
  weight: number
  height: number
  age: number
  sex: "hombre" | "mujer"
  bodyType: string

  waist: string
  hip: string
  chest: string
  skipMeasurements: boolean

  goalWeightKg: number
  goalDescription: string

  trainingFrequency: "1-2" | "3-4" | "5-6" | "7"
  trainingLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  preferredEquipment: string[]

  gymAction: "join" | "create" | "skip"
  gymId: string
  gymName: string

  dietType: string
  avoidFoods: string
  allergies: string[]
  allergyOther: string
  hasAirFryer: boolean
  takesSupplements: boolean
  supplementsDetail: string[]
  supplementOther: string

  cookingLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  weeklyBudget: string
}

const STEPS = [
  { title: "Datos básicos", description: "Peso, altura, edad, complexión" },
  { title: "Medidas", description: "Cintura, cadera, pecho (opcional)" },
  { title: "Objetivo", description: "Meta de peso y descripción" },
  { title: "Entrenamiento", description: "Frecuencia, nivel y equipamiento" },
  { title: "Gimnasio", description: "Únete, crea uno nuevo o sáltalo" },
  { title: "Nutrición", description: "Dieta, alergias y suplementos" },
  { title: "Cocina y compra", description: "Experiencia y presupuesto" },
  { title: "Resumen", description: "Revisa y confirma" },
]

const EQUIPMENT_OPTIONS = [
  { value: "dumbbell", label: "Mancuernas" },
  { value: "barbell", label: "Barra" },
  { value: "bands", label: "Bandas elásticas" },
  { value: "bench", label: "Banco" },
  { value: "none", label: "Ninguno" },
]

const ALLERGY_OPTIONS = [
  { value: "gluten", label: "Gluten" },
  { value: "lactosa", label: "Lactosa" },
  { value: "frutos_secos", label: "Frutos secos" },
  { value: "marisco", label: "Marisco" },
  { value: "huevo", label: "Huevo" },
  { value: "soja", label: "Soja" },
]

const SUPPLEMENT_OPTIONS = [
  { value: "proteina", label: "Proteína en polvo" },
  { value: "creatina", label: "Creatina" },
  { value: "multivitaminico", label: "Multivitamínico" },
  { value: "omega3", label: "Omega 3" },
]

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-green-600 bg-green-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-green-400"
      )}
    >
      {children}
    </button>
  )
}

function toggleInArray(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

export function OnboardingFlowV4({ userName }: { userName: string }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [gyms, setGyms] = useState<GymSummary[]>([])

  const [data, setData] = useState<OnboardingData>({
    weight: 70,
    height: 170,
    age: 30,
    sex: "hombre",
    bodyType: "",
    waist: "",
    hip: "",
    chest: "",
    skipMeasurements: false,
    goalWeightKg: 65,
    goalDescription: "",
    trainingFrequency: "3-4",
    trainingLevel: "INTERMEDIATE",
    preferredEquipment: [],
    gymAction: "skip",
    gymId: "",
    gymName: "",
    dietType: "Mediterranean",
    avoidFoods: "",
    allergies: [],
    allergyOther: "",
    hasAirFryer: false,
    takesSupplements: false,
    supplementsDetail: [],
    supplementOther: "",
    cookingLevel: "BEGINNER",
    weeklyBudget: "",
  })

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [profileRes, gymsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/gyms"),
        ])

        if (gymsRes.ok) {
          const gymsData = await gymsRes.json()
          setGyms(gymsData.gyms ?? [])
        }

        if (profileRes.ok) {
          const { profile, goal } = await profileRes.json()
          if (profile) {
            setData((prev) => ({
              ...prev,
              weight: profile.weightKg ?? prev.weight,
              height: profile.heightCm ?? prev.height,
              age: profile.age ?? prev.age,
              sex: profile.sex === "M" ? "hombre" : profile.sex === "F" ? "mujer" : profile.sex === "hombre" || profile.sex === "mujer" ? profile.sex : prev.sex,
              bodyType: profile.bodyType ?? prev.bodyType,
              waist: profile.waistCm ? String(profile.waistCm) : prev.waist,
              hip: profile.hipCm ? String(profile.hipCm) : prev.hip,
              chest: profile.chestCm ? String(profile.chestCm) : prev.chest,
              trainingFrequency: (profile.trainingFrequency as OnboardingData["trainingFrequency"]) ?? prev.trainingFrequency,
              preferredEquipment: profile.homeEquipment ? JSON.parse(profile.homeEquipment) : prev.preferredEquipment,
              dietType: profile.dietType ?? prev.dietType,
              avoidFoods: profile.forbiddenFoods ?? prev.avoidFoods,
              allergies: profile.allergies ? JSON.parse(profile.allergies) : prev.allergies,
              hasAirFryer: profile.hasAirFryer ?? prev.hasAirFryer,
              takesSupplements: profile.takesSupplements ?? prev.takesSupplements,
              supplementsDetail: profile.supplementsDetail ? JSON.parse(profile.supplementsDetail) : prev.supplementsDetail,
              cookingLevel: profile.cookingLevel ?? prev.cookingLevel,
              weeklyBudget: profile.weeklyBudget ? String(profile.weeklyBudget) : prev.weeklyBudget,
              gymId: profile.gymId ?? prev.gymId,
              gymAction: profile.gymId ? "join" : prev.gymAction,
            }))
          }
          if (goal?.targetWeightKg) {
            setData((prev) => ({ ...prev, goalWeightKg: goal.targetWeightKg }))
          }
        }
      } catch {
        // si falla la precarga, el wizard sigue con los valores por defecto
      } finally {
        setLoadingProfile(false)
      }
    }
    loadInitialData()
  }, [])

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const allergies = [...data.allergies, ...(data.allergyOther.trim() ? [data.allergyOther.trim()] : [])]
      const supplementsDetail = data.takesSupplements
        ? [...data.supplementsDetail, ...(data.supplementOther.trim() ? [data.supplementOther.trim()] : [])]
        : []

      const payload = {
        weight: data.weight,
        height: data.height,
        age: data.age,
        sex: data.sex,
        bodyType: data.bodyType || undefined,
        waist: data.skipMeasurements || !data.waist ? undefined : parseFloat(data.waist),
        hip: data.skipMeasurements || !data.hip ? undefined : parseFloat(data.hip),
        chest: data.skipMeasurements || !data.chest ? undefined : parseFloat(data.chest),
        goalWeightKg: data.goalWeightKg,
        goalDescription: data.goalDescription || undefined,
        trainingFrequency: data.trainingFrequency,
        trainingLevel: data.trainingLevel,
        preferredEquipment: data.preferredEquipment,
        gymAction: data.gymAction,
        gymId: data.gymAction === "join" ? data.gymId : undefined,
        gymName: data.gymAction === "create" ? data.gymName : undefined,
        dietType: data.dietType,
        avoidFoods: data.avoidFoods,
        allergies,
        hasAirFryer: data.hasAirFryer,
        takesSupplements: data.takesSupplements,
        supplementsDetail,
        cookingLevel: data.cookingLevel,
        weeklyBudget: data.weeklyBudget ? parseFloat(data.weeklyBudget) : undefined,
      }

      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error guardando onboarding")
      }

      toast.success("¡Onboarding completado!")
      router.push("/Hoy")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  const canGoNext = () => {
    if (currentStep === 4 && data.gymAction === "join" && !data.gymId) return false
    if (currentStep === 4 && data.gymAction === "create" && !data.gymName.trim()) return false
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {userName}</h1>
          <p className="mt-2 text-gray-600">
            Vamos a configurar tu perfil en {STEPS.length} pasos
          </p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-sm text-gray-600 text-center">
            Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <p className="text-sm text-gray-600">{STEPS[currentStep].description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingProfile && currentStep === 0 && (
              <p className="text-sm text-gray-500">Cargando tus datos...</p>
            )}

            {currentStep === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      value={data.weight}
                      onChange={(e) => setData({ ...data, weight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      value={data.height}
                      onChange={(e) => setData({ ...data, height: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Edad</Label>
                    <Input
                      type="number"
                      value={data.age}
                      onChange={(e) => setData({ ...data, age: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Sexo</Label>
                    <select
                      value={data.sex}
                      onChange={(e) => setData({ ...data, sex: e.target.value as "hombre" | "mujer" })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="hombre">Hombre</option>
                      <option value="mujer">Mujer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Complexión</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Delgada", "Media", "Fuerte"].map((option) => (
                      <Pill
                        key={option}
                        active={data.bodyType === option}
                        onClick={() => setData({ ...data, bodyType: option })}
                      >
                        {option}
                      </Pill>
                    ))}
                  </div>
                  <Input
                    className="mt-2"
                    value={data.bodyType}
                    onChange={(e) => setData({ ...data, bodyType: e.target.value })}
                    placeholder="O escribe la tuya"
                  />
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Cintura (cm)</Label>
                    <Input
                      type="number"
                      value={data.waist}
                      disabled={data.skipMeasurements}
                      onChange={(e) => setData({ ...data, waist: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Cadera (cm)</Label>
                    <Input
                      type="number"
                      value={data.hip}
                      disabled={data.skipMeasurements}
                      onChange={(e) => setData({ ...data, hip: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Pecho (cm)</Label>
                    <Input
                      type="number"
                      value={data.chest}
                      disabled={data.skipMeasurements}
                      onChange={(e) => setData({ ...data, chest: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setData({ ...data, skipMeasurements: !data.skipMeasurements })}
                >
                  {data.skipMeasurements ? "Quiero indicarlas" : "Prefiero no indicarlo / Saltar"}
                </Button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <Label>Meta de peso (kg)</Label>
                  <Input
                    type="number"
                    value={data.goalWeightKg}
                    onChange={(e) => setData({ ...data, goalWeightKg: parseFloat(e.target.value) || 0 })}
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

            {currentStep === 3 && (
              <>
                <div>
                  <Label>Frecuencia de entrenamiento</Label>
                  <select
                    value={data.trainingFrequency}
                    onChange={(e) => setData({ ...data, trainingFrequency: e.target.value as OnboardingData["trainingFrequency"] })}
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
                    onChange={(e) => setData({ ...data, trainingLevel: e.target.value as OnboardingData["trainingLevel"] })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                  </select>
                </div>
                <div>
                  <Label>Equipamiento en casa</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((opt) => (
                      <Pill
                        key={opt.value}
                        active={data.preferredEquipment.includes(opt.value)}
                        onClick={() =>
                          setData({ ...data, preferredEquipment: toggleInArray(data.preferredEquipment, opt.value) })
                        }
                      >
                        {opt.label}
                      </Pill>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Pill active={data.gymAction === "join"} onClick={() => setData({ ...data, gymAction: "join" })}>
                    Unirme a uno existente
                  </Pill>
                  <Pill active={data.gymAction === "create"} onClick={() => setData({ ...data, gymAction: "create" })}>
                    Crear uno nuevo
                  </Pill>
                  <Pill active={data.gymAction === "skip"} onClick={() => setData({ ...data, gymAction: "skip" })}>
                    Saltar por ahora
                  </Pill>
                </div>

                {data.gymAction === "join" && (
                  <div className="space-y-2">
                    {gyms.length === 0 && (
                      <p className="text-sm text-gray-500">No hay gimnasios públicos todavía.</p>
                    )}
                    {gyms.map((gym) => (
                      <button
                        key={gym.id}
                        type="button"
                        onClick={() => setData({ ...data, gymId: gym.id })}
                        className={cn(
                          "w-full rounded-md border p-3 text-left transition-colors",
                          data.gymId === gym.id ? "border-green-600 bg-green-50" : "border-gray-300"
                        )}
                      >
                        <p className="font-medium">{gym.name}</p>
                        <p className="text-xs text-gray-500">
                          {gym.location ? `${gym.location} · ` : ""}
                          {gym._count.machines} máquinas
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {data.gymAction === "create" && (
                  <div>
                    <Label>Nombre del gimnasio</Label>
                    <Input
                      value={data.gymName}
                      onChange={(e) => setData({ ...data, gymName: e.target.value })}
                      placeholder="Ej: Mi gimnasio"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Se creará con 7 máquinas básicas de ejemplo (Chest Press, Seated Row, Shoulder Press,
                      Prensa de Piernas, Curl de Piernas Sentado, Extensión de Piernas y Smith Machine), que
                      podrás editar o quitar después desde &quot;Gimnasios&quot;.
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 5 && (
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
                  <Label>Alergias / intolerancias</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ALLERGY_OPTIONS.map((opt) => (
                      <Pill
                        key={opt.value}
                        active={data.allergies.includes(opt.value)}
                        onClick={() => setData({ ...data, allergies: toggleInArray(data.allergies, opt.value) })}
                      >
                        {opt.label}
                      </Pill>
                    ))}
                  </div>
                  <Input
                    className="mt-2"
                    value={data.allergyOther}
                    onChange={(e) => setData({ ...data, allergyOther: e.target.value })}
                    placeholder="Otra alergia (opcional)"
                  />
                </div>
                <div>
                  <Label>¿Tienes air fryer?</Label>
                  <div className="mt-2 flex gap-2">
                    <Pill active={data.hasAirFryer} onClick={() => setData({ ...data, hasAirFryer: true })}>
                      Sí
                    </Pill>
                    <Pill active={!data.hasAirFryer} onClick={() => setData({ ...data, hasAirFryer: false })}>
                      No
                    </Pill>
                  </div>
                </div>
                <div>
                  <Label>¿Tomas suplementos?</Label>
                  <div className="mt-2 flex gap-2">
                    <Pill active={data.takesSupplements} onClick={() => setData({ ...data, takesSupplements: true })}>
                      Sí
                    </Pill>
                    <Pill active={!data.takesSupplements} onClick={() => setData({ ...data, takesSupplements: false, supplementsDetail: [], supplementOther: "" })}>
                      No
                    </Pill>
                  </div>
                  {data.takesSupplements && (
                    <>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SUPPLEMENT_OPTIONS.map((opt) => (
                          <Pill
                            key={opt.value}
                            active={data.supplementsDetail.includes(opt.value)}
                            onClick={() => setData({ ...data, supplementsDetail: toggleInArray(data.supplementsDetail, opt.value) })}
                          >
                            {opt.label}
                          </Pill>
                        ))}
                      </div>
                      <Input
                        className="mt-2"
                        value={data.supplementOther}
                        onChange={(e) => setData({ ...data, supplementOther: e.target.value })}
                        placeholder="Otro suplemento (opcional)"
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {currentStep === 6 && (
              <>
                <div>
                  <Label>Nivel de experiencia en cocina</Label>
                  <select
                    value={data.cookingLevel}
                    onChange={(e) => setData({ ...data, cookingLevel: e.target.value as OnboardingData["cookingLevel"] })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Medio</option>
                    <option value="ADVANCED">Avanzado</option>
                  </select>
                </div>
                <div>
                  <Label>Presupuesto semanal de compra (€, opcional)</Label>
                  <Input
                    type="number"
                    value={data.weeklyBudget}
                    onChange={(e) => setData({ ...data, weeklyBudget: e.target.value })}
                    placeholder="Ej: 60"
                  />
                </div>
              </>
            )}

            {currentStep === 7 && (
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Peso / Altura / Edad:</strong> {data.weight} kg · {data.height} cm · {data.age} años ({data.sex})</p>
                {data.bodyType && <p><strong>Complexión:</strong> {data.bodyType}</p>}
                {!data.skipMeasurements && (data.waist || data.hip || data.chest) && (
                  <p><strong>Medidas:</strong> cintura {data.waist || "-"} / cadera {data.hip || "-"} / pecho {data.chest || "-"} cm</p>
                )}
                <p><strong>Objetivo:</strong> {data.goalWeightKg} kg {data.goalDescription && `— ${data.goalDescription}`}</p>
                <p><strong>Entrenamiento:</strong> {data.trainingFrequency} días/semana, nivel {data.trainingLevel}</p>
                {data.preferredEquipment.length > 0 && (
                  <p><strong>Equipamiento:</strong> {data.preferredEquipment.join(", ")}</p>
                )}
                <p>
                  <strong>Gimnasio:</strong>{" "}
                  {data.gymAction === "join" && (gyms.find((g) => g.id === data.gymId)?.name ?? "seleccionado")}
                  {data.gymAction === "create" && `nuevo (${data.gymName})`}
                  {data.gymAction === "skip" && "sin gimnasio por ahora"}
                </p>
                <p><strong>Dieta:</strong> {data.dietType} {data.avoidFoods && `— evitar: ${data.avoidFoods}`}</p>
                {data.allergies.length > 0 && <p><strong>Alergias:</strong> {data.allergies.join(", ")}</p>}
                <p><strong>Air fryer:</strong> {data.hasAirFryer ? "Sí" : "No"}</p>
                <p>
                  <strong>Suplementos:</strong>{" "}
                  {data.takesSupplements ? data.supplementsDetail.join(", ") || "sí" : "No"}
                </p>
                <p><strong>Cocina:</strong> nivel {data.cookingLevel}{data.weeklyBudget && ` · presupuesto ${data.weeklyBudget}€/semana`}</p>
              </div>
            )}
          </CardContent>
        </Card>

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
              disabled={loading || !canGoNext()}
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
                  ¡Confirmar!
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
