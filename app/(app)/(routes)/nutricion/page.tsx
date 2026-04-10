"use client"

import { useEffect, useState } from "react"
import { Clock, Utensils, Flame, Droplets, RefreshCw, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface NutritionalNeeds {
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
}

interface MealPlan {
  [key: string]: { main: string; side: string; dessert?: string; calories: number }[]
}

interface Adaptations {
  adaptations?: string[]
}

export default function NutricionPage() {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<{ necesidades: NutritionalNeeds; planComidas: MealPlan } & Adaptations | null>(null)
  const [adapting, setAdapting] = useState(false)
  const [adapted, setAdapted] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/plan")
      if (res.ok) {
        const data = await res.json()
        if (data.plan?.planJson) {
          const parsed = JSON.parse(data.plan.planJson)
          setPlan(parsed)
          if (parsed.adaptations && parsed.adaptations.length > 0) {
            setAdapted(true)
          }
        }
      }
      setLoading(false)
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
          setPlan(data.plan)
          setAdapted(true)
        }
      }
    } finally {
      setAdapting(false)
    }
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

  const mealTypes = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"]

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nutrición</h1>
        <Button variant="outline" size="sm" onClick={adaptarPlan} disabled={adapting}>
          {adapting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Adaptar plan
        </Button>
      </div>

      {adapted && plan.adaptations && plan.adaptations.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
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
        <Card className="bg-orange-50">
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-xl font-bold">{plan.necesidades.calories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-3 text-center">
            <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xl font-bold">{plan.necesidades.water}L</p>
            <p className="text-xs text-muted-foreground">agua</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-bold text-red-600">{plan.necesidades.protein}g</span>
            <p className="text-xs text-muted-foreground">proteína</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-bold text-green-600">{plan.necesidades.carbs}g</span>
            <p className="text-xs text-muted-foreground">carbs</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-bold text-yellow-600">{plan.necesidades.fat}g</span>
            <p className="text-xs text-muted-foreground">grasa</p>
          </CardContent>
        </Card>
      </div>

      {mealTypes.map((tipo) => {
        const meals = plan.planComidas[tipo]
        if (!meals || meals.length === 0) return null

        return (
          <Card key={tipo}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" /> {tipo}
                </span>
                <Badge variant="secondary">{meals.reduce((sum, m) => sum + m.calories, 0)} kcal</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {meals.map((meal, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{meal.main}</p>
                    {meal.side && <p className="text-xs text-muted-foreground">{meal.side}</p>}
                    {meal.dessert && <p className="text-xs text-muted-foreground">Postre: {meal.dessert}</p>}
                  </div>
                  <Badge variant="outline">{meal.calories} kcal</Badge>
                </div>
              ))}
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
              const meals = plan.planComidas[tipo] || []
              const total = meals.reduce((sum, m) => sum + m.calories, 0)
              const pct = plan.necesidades.calories > 0 ? Math.round((total / plan.necesidades.calories) * 100) : 0
              return (
                <div key={tipo} className="flex items-center gap-2">
                  <span className="w-20 text-sm text-muted-foreground">{tipo}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs w-12 text-right">{total} kcal</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}