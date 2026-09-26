"use client"

import { useEffect, useRef, useState } from "react"
import {
  Clock,
  Utensils,
  Camera,
  X,
  Loader2,
  AlertTriangle,
  Users,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PlanIngredient {
  nombre: string
  cantidad: number
  unidad?: string
}

interface PlanMeal {
  nombre?: string
  horario?: string
  calorias?: number
  ingredientes?: PlanIngredient[]
  instrucciones?: string[]
  notas?: string
}

interface NutritionistPlan {
  id: string
  status: string
  version: number
  needsReview: boolean
  mealsJson: string | null
  equivalencesJson: string | null
  extractedText: string | null
  households: HouseholdMember[]
}

interface HouseholdMember {
  id: string
  name: string
  age: number | null
  portionFactor: number
}

interface AnalysisResult {
  id: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
}

const MEAL_ORDER: Array<{ key: string; label: string }> = [
  { key: "desayuno", label: "Desayuno" },
  { key: "mediaManana", label: "Media mañana" },
  { key: "comida", label: "Comida" },
  { key: "merienda", label: "Merienda" },
  { key: "cena", label: "Cena" },
]

interface RecipeIngredientView {
  name: string
  weight: number | null
}

interface RecipeView {
  id: string
  name: string
  description: string | null
  preparationTime: number | null
  servings: number
  method: string
  steps: string[]
  allergens: string[]
  ingredients: RecipeIngredientView[]
}

interface RecipeOptions {
  recommended: RecipeView | null
  alternatives: { day: string; recipe: RecipeView }[]
}

interface TodayResponse {
  ok: boolean
  hasPlan: boolean
  today?: string
  desayuno?: { horario?: string; descripcion?: string } | null
  mediaManana?: { horario?: string; descripcion?: string; hoy: string | null; opciones: string[]; notas?: string } | null
  comida?: ({ horario?: string; descripcion?: string } & RecipeOptions) | null
  merienda?: { horario?: string; descripcion?: string; opciones: string[]; notas?: string } | null
  cena?: ({ horario?: string; descripcion?: string } & RecipeOptions) | null
}

const DAY_LABEL: Record<string, string> = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves",
  VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
}

export default function NutricionPage() {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<NutritionistPlan | null>(null)
  const [meals, setMeals] = useState<Record<string, PlanMeal>>({})
  const [household, setHousehold] = useState<HouseholdMember[]>([])
  const [newMemberName, setNewMemberName] = useState("")
  const [addingMember, setAddingMember] = useState(false)
  const [generatingList, setGeneratingList] = useState(false)

  const [today, setToday] = useState<TodayResponse | null>(null)
  const [openAlternatives, setOpenAlternatives] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedMealType, setSelectedMealType] = useState("desayuno")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/nutrition/plan/current")
        if (res.ok) {
          const data = await res.json()
          if (data.plan) {
            setPlan(data.plan)
            setHousehold(data.plan.households || [])
            if (data.plan.mealsJson) {
              try {
                setMeals(JSON.parse(data.plan.mealsJson))
              } catch {
                setMeals({})
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading nutrition plan:", err)
      } finally {
        setLoading(false)
      }
    }
    load()

    fetch("/api/nutrition/today")
      .then((r) => r.json())
      .then((data: TodayResponse) => setToday(data))
      .catch(() => null)
  }, [])

  const addMember = async () => {
    if (!newMemberName.trim()) return
    setAddingMember(true)
    try {
      const res = await fetch("/api/nutrition/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMemberName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setHousehold((prev) => [...prev, data.member])
        setNewMemberName("")
      }
    } finally {
      setAddingMember(false)
    }
  }

  const removeMember = async (id: string) => {
    setHousehold((prev) => prev.filter((m) => m.id !== id))
    await fetch(`/api/nutrition/household/${id}`, { method: "DELETE" })
  }

  const generateShoppingList = async () => {
    setGeneratingList(true)
    try {
      const res = await fetch("/api/nutrition/shopping-list/generate", { method: "POST" })
      if (res.ok) {
        window.location.href = "/compra"
      } else {
        const data = await res.json().catch(() => null)
        alert(data?.error || "No se pudo generar la lista de la compra")
      }
    } finally {
      setGeneratingList(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mealType", selectedMealType)

      const res = await fetch("/api/ai/meal-photo", { method: "POST", body: formData })
      if (res.ok) {
        const data = await res.json()
        setAnalysisResult(data)
      } else {
        const error = await res.json()
        alert(error.error?.message || "Error analizando la imagen")
      }
    } catch (err) {
      console.error("Analysis error:", err)
      alert("Fallo al analizar la imagen")
    } finally {
      setAnalyzing(false)
    }
  }

  const openCamera = (mealType: string) => {
    setSelectedMealType(mealType)
    setShowCamera(true)
  }

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-muted-foreground">No tienes un plan de nutricionista cargado todavía</p>
            <p className="text-xs text-muted-foreground">
              Sube el PDF de tu plan desde el apartado de importación para empezar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,_rgba(14,26,19,0.92),_rgba(80,200,120,0.72))] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              Plan de tu nutricionista · v{plan.version}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Nutrición</h1>
            <p className="mt-2 text-sm text-white/80">
              Horario fijo de comidas, equivalencias y análisis de fotos con IA.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => openCamera("desayuno")}>
              <Camera className="h-4 w-4 mr-2" />
              Analizar comida
            </Button>
            <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={generateShoppingList} disabled={generatingList}>
              {generatingList ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
              Lista de la compra
            </Button>
          </div>
        </div>
      </section>

      {plan.needsReview && (
        <Card className="rounded-[1.75rem] border-amber-300 bg-amber-50 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Este plan necesita revisión</p>
              <p className="text-xs text-amber-700">
                Hay cantidades o equivalencias que no estaban explícitas en el documento original y no se han inventado.
                Revísalas con tu nutricionista antes de darlas por definitivas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {today?.hasPlan && (
        <>
          {today.desayuno && (
            <MealCard title="Desayuno" horario={today.desayuno.horario} onCamera={() => openCamera("desayuno")}>
              <p className="text-sm text-muted-foreground">{today.desayuno.descripcion}</p>
            </MealCard>
          )}

          {today.mediaManana && (
            <MealCard title="Media mañana" horario={today.mediaManana.horario} onCamera={() => openCamera("mediaManana")}>
              <p className="text-sm text-muted-foreground">{today.mediaManana.descripcion}</p>
              {today.mediaManana.hoy && (
                <p className="text-sm font-medium">Hoy: {today.mediaManana.hoy}</p>
              )}
              {today.mediaManana.opciones.length > 0 && (
                <OptionsToggle
                  isOpen={openAlternatives === "mediaManana"}
                  onToggle={() => setOpenAlternatives((v) => (v === "mediaManana" ? null : "mediaManana"))}
                >
                  <div className="flex flex-wrap gap-2">
                    {today.mediaManana.opciones.map((op, i) => (
                      <Badge key={i} variant="secondary" className="font-normal text-xs">{op}</Badge>
                    ))}
                  </div>
                </OptionsToggle>
              )}
            </MealCard>
          )}

          {today.comida && (
            <MealCard title="Comida" horario={today.comida.horario} onCamera={() => openCamera("comida")}>
              {today.comida.descripcion && <p className="text-xs text-muted-foreground">{today.comida.descripcion}</p>}
              <RecipeBlock recipe={today.comida.recommended} label="Hoy toca" />
              {today.comida.alternatives.length > 0 && (
                <OptionsToggle
                  isOpen={openAlternatives === "comida"}
                  onToggle={() => setOpenAlternatives((v) => (v === "comida" ? null : "comida"))}
                  label={`Ver otras ${today.comida.alternatives.length} opciones`}
                >
                  <div className="space-y-3">
                    {today.comida.alternatives.map(({ day, recipe }) => (
                      <RecipeBlock key={recipe.id} recipe={recipe} label={DAY_LABEL[day] ?? day} compact />
                    ))}
                  </div>
                </OptionsToggle>
              )}
            </MealCard>
          )}

          {today.merienda && (
            <MealCard title="Merienda" horario={today.merienda.horario} onCamera={() => openCamera("merienda")}>
              <p className="text-sm text-muted-foreground">{today.merienda.descripcion}</p>
              {today.merienda.opciones.length > 0 && (
                <OptionsToggle
                  isOpen={openAlternatives === "merienda"}
                  onToggle={() => setOpenAlternatives((v) => (v === "merienda" ? null : "merienda"))}
                  label="Ver opciones"
                >
                  <div className="flex flex-wrap gap-2">
                    {today.merienda.opciones.map((op, i) => (
                      <Badge key={i} variant="secondary" className="font-normal text-xs">{op}</Badge>
                    ))}
                  </div>
                </OptionsToggle>
              )}
            </MealCard>
          )}

          {today.cena && (
            <MealCard title="Cena" horario={today.cena.horario} onCamera={() => openCamera("cena")}>
              {today.cena.descripcion && <p className="text-xs text-muted-foreground">{today.cena.descripcion}</p>}
              <RecipeBlock recipe={today.cena.recommended} label="Hoy toca" />
              {today.cena.alternatives.length > 0 && (
                <OptionsToggle
                  isOpen={openAlternatives === "cena"}
                  onToggle={() => setOpenAlternatives((v) => (v === "cena" ? null : "cena"))}
                  label={`Ver otras ${today.cena.alternatives.length} opciones`}
                >
                  <div className="space-y-3">
                    {today.cena.alternatives.map(({ day, recipe }) => (
                      <RecipeBlock key={recipe.id} recipe={recipe} label={DAY_LABEL[day] ?? day} compact />
                    ))}
                  </div>
                </OptionsToggle>
              )}
            </MealCard>
          )}
        </>
      )}

      <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Comensales del hogar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Añade a las personas con las que compartes las comidas para escalar las raciones.
          </p>
          <div className="flex flex-wrap gap-2">
            {household.map((m) => (
              <Badge key={m.id} variant="outline" className="flex items-center gap-2 py-1">
                {m.name}
                <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {household.length === 0 && <p className="text-xs text-muted-foreground">Sin comensales añadidos.</p>}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
            />
            <Button onClick={addMember} disabled={addingMember || !newMemberName.trim()}>
              Añadir
            </Button>
          </div>
        </CardContent>
      </Card>

      {showCamera && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Analizar comida</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowCamera(false); setAnalysisResult(null) }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona una foto de tu comida para analizar sus macronutrientes.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />

              <Button className="w-full" onClick={() => fileInputRef.current?.click()} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Tomar/Seleccionar foto
                  </>
                )}
              </Button>

              {analysisResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-semibold">Resultados del análisis:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calorías:</span>
                      <span className="font-medium">{analysisResult.calories} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proteína:</span>
                      <span className="font-medium">{analysisResult.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carbs:</span>
                      <span className="font-medium">{analysisResult.carbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grasa:</span>
                      <span className="font-medium">{analysisResult.fat}g</span>
                    </div>
                  </div>
                  {analysisResult.ingredients.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mt-2">Ingredientes detectados:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.ingredients.map((ing, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{ing}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => { setShowCamera(false); setAnalysisResult(null) }}
                  >
                    Cerrar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function MealCard({
  title,
  horario,
  onCamera,
  children,
}: {
  title: string
  horario?: string
  onCamera: () => void
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Utensils className="h-4 w-4" /> {title}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onCamera}>
              <Camera className="h-3 w-3" />
            </Button>
            {horario && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {horario}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

function OptionsToggle({
  isOpen,
  onToggle,
  label = "Ver otras opciones",
  children,
}: {
  isOpen: boolean
  onToggle: () => void
  label?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onToggle}>
        {isOpen ? "Ocultar opciones" : label}
      </Button>
      {isOpen && children}
    </div>
  )
}

function RecipeBlock({ recipe, label, compact }: { recipe: RecipeView | null; label: string; compact?: boolean }) {
  if (!recipe) return null
  return (
    <div className={compact ? "rounded-lg border border-muted p-2 space-y-1" : "space-y-2"}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
        {recipe.preparationTime != null && (
          <span className="text-[10px] text-muted-foreground">{recipe.preparationTime} min</span>
        )}
      </div>
      <p className={compact ? "text-sm font-medium" : "font-medium text-sm"}>{recipe.name}</p>

      <div className="flex flex-wrap gap-2">
        {recipe.ingredients.map((ing, i) => (
          <Badge key={i} variant="secondary" className="font-normal text-[10px]">
            {ing.name}{ing.weight != null ? ` (${ing.weight}g)` : ""}
          </Badge>
        ))}
      </div>

      {!compact && recipe.steps.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Preparación:</p>
          <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {recipe.description && (
        <p className="text-[11px] text-muted-foreground italic border-l-2 border-muted pl-2">{recipe.description}</p>
      )}
    </div>
  )
}
