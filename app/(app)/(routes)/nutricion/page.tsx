"use client"

import { useEffect, useState, useRef } from "react"
import { Clock, Utensils, Flame, Droplets, RefreshCw, CheckCircle2, Camera, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { normalizeMacros, normalizeMealPlan } from "@/lib/plan-normalizers"

interface Adaptations {
  adaptations?: string[]
}

interface AnalysisResult {
  id: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
}

export default function NutricionPage() {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<{ necesidades: ReturnType<typeof normalizeMacros>; planComidas: ReturnType<typeof normalizeMealPlan> } & Adaptations | null>(null)
  const [adapting, setAdapting] = useState(false)
  const [adapted, setAdapted] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedMealType, setSelectedMealType] = useState("desayuno")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/plan")
        if (res.ok) {
          const data = await res.json()
          if (data.plan?.planJson) {
            const parsed = JSON.parse(data.plan.planJson)

            const normalizedPlan = {
              necesidades: normalizeMacros(parsed.necesidades || parsed.macros),
              planComidas: normalizeMealPlan(parsed.planComidas || parsed.mealPlan),
              adaptations: parsed.adaptations || []
            }

            setPlan(normalizedPlan)
            if (normalizedPlan.adaptations && normalizedPlan.adaptations.length > 0) {
              setAdapted(true)
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
  }, [])

  const adaptarPlan = async () => {
    setAdapting(true)
    try {
      const res = await fetch("/api/plan/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "adapt" }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.plan) {
          setPlan({
            necesidades: normalizeMacros(data.plan.necesidades || data.plan.macros),
            planComidas: normalizeMealPlan(data.plan.planComidas || data.plan.mealPlan),
            adaptations: data.plan.adaptations || [],
          })
          setAdapted(true)
        }
      }
    } finally {
      setAdapting(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mealType', selectedMealType)

      const res = await fetch('/api/ai/meal-photo', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setAnalysisResult(data)
      } else {
        const error = await res.json()
        alert(error.error?.message || 'Error analyzing image')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      alert('Failed to analyze image')
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
      <div className="p-4 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No tienes un plan nutricional generado</p>
            <a href="/perfil" className="text-emerald-600 hover:underline">Generar plan desde perfil</a>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mealTypes = ["Desayuno", "Snack mañana", "Almuerzo", "Merienda", "Cena"]

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,_rgba(14,26,19,0.92),_rgba(80,200,120,0.72))] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">Plan nutricional</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Nutrición</h1>
            <p className="mt-2 text-sm text-white/80">Seguimiento de macros, análisis de fotos con IA y adaptación del plan según tus hábitos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => openCamera('desayuno')}>
              <Camera className="h-4 w-4 mr-2" />
              Analizar comida
            </Button>
            <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={adaptarPlan} disabled={adapting}>
              {adapting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Adaptar plan
            </Button>
          </div>
        </div>
      </section>

      {adapted && plan.adaptations && plan.adaptations.length > 0 && (
        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
              Adaptaciones aplicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {plan.adaptations.map((a, i) => (
                <Badge key={i} variant="outline" className="bg-white">
                  {a}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-xl font-bold">{plan.necesidades.calories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-3 text-center">
            <Droplets className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-xl font-bold">{plan.necesidades.water.toFixed(1)}L</p>
            <p className="text-xs text-muted-foreground">agua</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{Math.round(plan.necesidades.protein || (plan.necesidades as any).proteinas || 0)}g</p>
            <p className="text-xs text-muted-foreground">proteína</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{Math.round(plan.necesidades.carbs || (plan.necesidades as any).carbohidratos || 0)}g</p>
            <p className="text-xs text-muted-foreground">carbs</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{Math.round(plan.necesidades.fat || (plan.necesidades as any).grasas || 0)}g</p>
            <p className="text-xs text-muted-foreground">grasa</p>
          </CardContent>
        </Card>
      </div>

      {mealTypes.map((tipo) => {
        const keyMap: Record<string, string> = {
          "Desayuno": "desayuno",
          "Snack mañana": "mediaManana",
          "Almuerzo": "almuerzo",
          "Merienda": "merienda",
          "Cena": "cena"
        }
        
        const mealKey = keyMap[tipo] || tipo.toLowerCase()
        const meal = plan.planComidas[mealKey]
        
        if (!meal) return null

        return (
          <Card key={tipo} className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" /> {tipo}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => openCamera(mealKey)}>
                    <Camera className="h-3 w-3" />
                  </Button>
                  <Badge variant="secondary">{meal.calorias} kcal</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{meal.nombre}</p>
                  <Badge variant="outline">{meal.calorias} kcal</Badge>
                </div>
                {/* Barra de distribución de macros — patrón Cronometer */}
                {(() => {
                  const totalCals = meal.proteinas * 4 + meal.carbohidratos * 4 + meal.grasas * 9
                  if (!totalCals) return null
                  const pPct = Math.round((meal.proteinas * 4 / totalCals) * 100)
                  const cPct = Math.round((meal.carbohidratos * 4 / totalCals) * 100)
                  const fPct = 100 - pPct - cPct
                  return (
                    <div>
                      <div className="flex h-2 overflow-hidden rounded-full">
                        <div className="bg-blue-400" style={{ width: `${pPct}%` }} />
                        <div className="bg-emerald-400" style={{ width: `${cPct}%` }} />
                        <div className="bg-yellow-400" style={{ width: `${fPct}%` }} />
                      </div>
                      <div className="mt-1.5 flex gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-400" />{meal.proteinas}g P</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />{meal.carbohidratos}g C</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />{meal.grasas}g G</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Ingredientes:</p>
                <div className="flex flex-wrap gap-2">
                  {meal.ingredientes.map((ing, i) => (
                    <Badge key={i} variant="secondary" className="font-normal text-[10px]">
                      {ing.nombre} ({ing.cantidad}{ing.unidad || ""})
                    </Badge>
                  ))}
                </div>
              </div>

              {meal.instrucciones && meal.instrucciones.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Instrucciones:</p>
                  <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                    {meal.instrucciones.slice(0, 3).map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                    {meal.instrucciones.length > 3 && <li>...</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Distribución calórica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mealTypes.map((tipo) => {
              const keyMap: Record<string, string> = {
                "Desayuno": "desayuno",
                "Almuerzo": "almuerzo",
                "Comida": "almuerzo",
                "Merienda": "merienda",
                "Cena": "cena"
              }
              const mealKey = keyMap[tipo] || tipo.toLowerCase()
              const meal = plan.planComidas[mealKey]
              const calories = meal?.calorias || 0
              const totalCalories = plan.necesidades.calories || 1
              const pct = Math.min(100, Math.round((calories / totalCalories) * 100))
              
              return (
                <div key={tipo} className="flex items-center gap-2">
                  <span className="w-20 text-sm text-muted-foreground">{tipo}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs w-12 text-right">{calories} kcal</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {showCamera && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Analizar Comida</CardTitle>
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
              
              <Button 
                className="w-full" 
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
              >
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