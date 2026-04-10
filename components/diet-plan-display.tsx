"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Flame, Zap } from "lucide-react"
import type { MealPlan, Meal, NutritionalNeeds } from "@/lib/diet-calculator"

interface DietPlanDisplayProps {
  mealPlan: MealPlan
  nutritionalNeeds: NutritionalNeeds
  userName: string
}

export function DietPlanDisplay({ mealPlan, nutritionalNeeds, userName }: DietPlanDisplayProps) {
  const meals = [
    { key: "desayuno", meal: mealPlan.desayuno, time: "08:00", icon: "🌅" },
    { key: "mediaManana", meal: mealPlan.mediaManana, time: "10:30", icon: "🍎" },
    { key: "almuerzo", meal: mealPlan.almuerzo, time: "14:00", icon: "🍽️" },
    { key: "merienda", meal: mealPlan.merienda, time: "17:00", icon: "🥜" },
    { key: "cena", meal: mealPlan.cena, time: "20:30", icon: "🌙" },
  ]

  const totalCalorias = meals.reduce((sum, { meal }) => sum + meal.calorias, 0)
  const totalProteinas = meals.reduce((sum, { meal }) => sum + meal.proteinas, 0)
  const totalCarbohidratos = meals.reduce((sum, { meal }) => sum + meal.carbohidratos, 0)
  const totalGrasas = meals.reduce((sum, { meal }) => sum + meal.grasas, 0)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Plan Nutricional Personalizado</h2>
        <p className="text-muted-foreground">Diseñado especialmente para {userName}</p>
      </div>

      {/* Resumen nutricional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Resumen Nutricional Diario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(totalCalorias)}</div>
              <div className="text-sm text-muted-foreground">Calorías</div>
              <div className="text-xs text-muted-foreground">Objetivo: {Math.round(nutritionalNeeds.calories)}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(totalProteinas)}g</div>
              <div className="text-sm text-muted-foreground">Proteínas</div>
              <div className="text-xs text-muted-foreground">Objetivo: {Math.round(nutritionalNeeds.protein)}g</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(totalCarbohidratos)}g</div>
              <div className="text-sm text-muted-foreground">Carbohidratos</div>
              <div className="text-xs text-muted-foreground">Objetivo: {Math.round(nutritionalNeeds.carbs)}g</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{Math.round(totalGrasas)}g</div>
              <div className="text-sm text-muted-foreground">Grasas</div>
              <div className="text-xs text-muted-foreground">Objetivo: {Math.round(nutritionalNeeds.fat)}g</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan de comidas */}
      <div className="grid gap-4">
        {meals.map(({ key, meal, time, icon }) => (
          <MealCard key={key} meal={meal} time={time} icon={icon} />
        ))}
      </div>

      {/* Recomendaciones adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">💧</Badge>
            <span>Bebe al menos {nutritionalNeeds.water.toFixed(1)} litros de agua al día</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">🥬</Badge>
            <span>Incluye al menos {Math.round(nutritionalNeeds.fiber)}g de fibra diaria</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">⏰</Badge>
            <span>Mantén horarios regulares de comida para mejor digestión</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">🚶</Badge>
            <span>Combina con actividad física regular según tu plan de entrenamiento</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MealCard({ meal, time, icon }: { meal: Meal; time: string; icon: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="font-semibold">{meal.nombre}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{meal.calorias} cal</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {meal.tiempoPreparacion} min
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Macronutrientes */}
        <div className="flex gap-4 text-sm">
          <span className="text-blue-600">P: {Math.round(meal.proteinas)}g</span>
          <span className="text-orange-600">C: {Math.round(meal.carbohidratos)}g</span>
          <span className="text-yellow-600">G: {Math.round(meal.grasas)}g</span>
        </div>

        <Separator />

        {/* Ingredientes */}
        <div>
          <h4 className="font-medium mb-2">Ingredientes:</h4>
          <ul className="space-y-1 text-sm">
            {meal.ingredientes.map((ingrediente, index) => (
              <li key={index} className="flex justify-between">
                <span>{ingrediente.nombre}</span>
                <span className="text-muted-foreground">
                  {ingrediente.cantidad} {ingrediente.unidad}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Instrucciones */}
        <div>
          <h4 className="font-medium mb-2">Preparación:</h4>
          <ol className="space-y-1 text-sm">
            {meal.instrucciones.map((paso, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-primary font-medium min-w-[20px]">{index + 1}.</span>
                <span>{paso}</span>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
