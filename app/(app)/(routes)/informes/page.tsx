"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Scale, Activity, Flame, Droplets } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DailyLog {
  date: string
  weightKg: number | null
  waterLiters: number | null
  energy: number | null
  mood: number | null
  caloriesConsumed?: number
}

interface WeeklyStats {
  avgWeight: number | null
  avgWater: number | null
  avgEnergy: number | null
  avgMood: number | null
  mealsCompleted: number
  exercisesCompleted: number
  totalMeals: number
  totalExercises: number
}

export default function InformesPage() {
  const [loading, setLoading] = useState(true)
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/tracking")
      if (res.ok) {
        const data = await res.json()
        if (data.dailyLog) {
          setDailyLogs([data.dailyLog])
        }
      }
      
      const statsRes = await fetch("/api/tracking?type=weekly")
      if (statsRes.ok) {
        const stats = await statsRes.json()
        if (stats.weeklyStats) {
          setWeeklyStats(stats.weeklyStats)
        }
      }
      
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  const latestLog = dailyLogs[0]

  const calculateTrend = (logs: DailyLog[], key: "weightKg" | "waterLiters" | "energy" | "mood") => {
    if (logs.length < 2) return null
    const values = logs.map(l => l[key]).filter(v => v !== null) as number[]
    if (values.length < 2) return null
    const diff = values[values.length - 1] - values[0]
    return diff > 0 ? "up" : diff < 0 ? "down" : "stable"
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Informes</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen de hoy</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Scale className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xl font-bold">{latestLog?.weightKg || "--"}</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>
          <div className="text-center p-3 bg-cyan-50 rounded-lg">
            <Droplets className="h-5 w-5 mx-auto text-cyan-500 mb-1" />
            <p className="text-xl font-bold">{latestLog?.waterLiters || 0}</p>
            <p className="text-xs text-muted-foreground">L agua</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <Flame className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-bold">{latestLog?.energy || 3}/5</p>
            <p className="text-xs text-muted-foreground">energía</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Activity className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-xl font-bold">{latestLog?.mood || 3}/5</p>
            <p className="text-xs text-muted-foreground">ánimo</p>
          </div>
        </CardContent>
      </Card>

      {weeklyStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Esta semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">{weeklyStats.avgWeight?.toFixed(1) || "--"}</p>
                <p className="text-xs text-muted-foreground">Peso avg</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">{weeklyStats.avgWater?.toFixed(1) || "--"}L</p>
                <p className="text-xs text-muted-foreground">Agua avg</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">{weeklyStats.avgEnergy?.toFixed(1) || "--"}</p>
                <p className="text-xs text-muted-foreground">Energía avg</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">{weeklyStats.avgMood?.toFixed(1) || "--"}</p>
                <p className="text-xs text-muted-foreground">Ánimo avg</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">
                  {weeklyStats.mealsCompleted}/{weeklyStats.totalMeals}
                </p>
                <p className="text-xs text-muted-foreground">Comidas</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Adherencia nutricional</span>
                <Badge variant={weeklyStats.totalMeals > 0 && weeklyStats.mealsCompleted / weeklyStats.totalMeals > 0.7 ? "default" : "secondary"}>
                  {weeklyStats.totalMeals > 0 ? Math.round((weeklyStats.mealsCompleted / weeklyStats.totalMeals) * 100) : 0}%
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${weeklyStats.totalMeals > 0 ? (weeklyStats.mealsCompleted / weeklyStats.totalMeals) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Adherencia entrenamiento</span>
                <Badge variant={weeklyStats.exercisesCompleted > 0 ? "default" : "secondary"}>
                  {weeklyStats.exercisesCompleted} ejercicios
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Consejos para mejorar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!weeklyStats || (weeklyStats.avgWater || 0) < 2) && (
            <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <Droplets className="h-4 w-4 text-blue-500 mt-0.5" />
              <p className="text-sm">Aumenta tu consumo de agua a 2-3 litros diarios</p>
            </div>
          )}
          {(!weeklyStats || (weeklyStats.avgEnergy || 0) < 3) && (
            <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-2">
              <Flame className="h-4 w-4 text-amber-500 mt-0.5" />
              <p className="text-sm">Duerme más horas para mejorar tu energía</p>
            </div>
          )}
          <div className="p-3 bg-green-50 rounded-lg flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-sm">¡Mantén la consistencia! Los pequeños cambios generan grandes resultados.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}