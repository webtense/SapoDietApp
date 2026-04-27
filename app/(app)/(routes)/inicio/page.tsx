"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { LogOut, Target, TrendingDown, TrendingUp, Scale, Droplets } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface User {
  id: string
  email: string
  name: string | null
}

interface Profile {
  age: number
  heightCm: number
  weightKg: number
  bodyType: string
  sex: string
  wakeUpTime: string
  sleepTime: string
  lunchTime: string
  dietType: string
  forbiddenFoods: string
  supermarket: string
  trainingFrequency: string
  trainingPlaces: string
  homeEquipment: string
}

interface Goal {
  id: string
  targetWeightKg: number
  targetWeeks: number
  targetDate: string
  viabilityStatus: string
}

interface DailyLog {
  date: string
  weightKg: number | null
  waterLiters: number | null
  energy: number | null
  mood: number | null
}

type WeightPoint = {
  date: string
  weightKg: number
}

export default function InicioPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const [weights, setWeights] = useState<WeightPoint[]>([])
  const [loading, setLoading] = useState(true)

  const chartData = useMemo(() => {
    return weights.map((p) => {
      const d = new Date(p.date)
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
      return { date: label, weightKg: p.weightKg }
    })
  }, [weights])

  const minW = weights.length ? Math.min(...weights.map((w) => w.weightKg)) : null
  const maxW = weights.length ? Math.max(...weights.map((w) => w.weightKg)) : null

  useEffect(() => {
    const load = async () => {
      const [userRes, profileRes, dailyRes, weightsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/profile"),
        fetch("/api/tracking"),
        fetch("/api/tracking?type=weights&days=30"),
      ])

      if (userRes.ok) {
        const u = await userRes.json()
        setUser(u.user)
      }
      if (profileRes.ok) {
        const p = await profileRes.json()
        setProfile(p.profile)
        setGoal(p.goal)
      }
      if (dailyRes.ok) {
        const d = await dailyRes.json()
        if (d.dailyLog) setDailyLog(d.dailyLog)
      }

      if (weightsRes.ok) {
        const w = await weightsRes.json()
        if (Array.isArray(w.items)) {
          setWeights(
            w.items
              .filter((p: any) => p && typeof p.date === "string" && typeof p.weightKg === "number")
              .map((p: any) => ({ date: p.date, weightKg: p.weightKg }))
          )
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  const latestWeight = weights.length ? weights[weights.length - 1].weightKg : dailyLog?.weightKg ?? profile?.weightKg ?? null
  const prevWeight = weights.length >= 2 ? weights[weights.length - 2].weightKg : null
  const weightDelta = latestWeight != null && prevWeight != null ? Number((latestWeight - prevWeight).toFixed(1)) : null

  const weightDiff = latestWeight != null && goal?.targetWeightKg != null ? latestWeight - goal.targetWeightKg : null
  const weightDirection = weightDiff !== null ? (weightDiff > 0 ? "down" : weightDiff < 0 ? "up" : "even") : null

  const waterTarget = 2.5
  const waterLiters = dailyLog?.waterLiters ?? 0
  const waterProgress = Math.round(Math.min(100, (waterLiters / waterTarget) * 100))

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hola, {user?.name || user?.email?.split("@")[0] || "Sapo"}</h1>
          <p className="text-sm text-muted-foreground">Bienvenido a tu plan</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-1" />
          Salir
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Scale className="h-4 w-4" />
              <span className="text-xs font-medium">Peso</span>
            </div>
            <p className="text-2xl font-bold">{latestWeight ?? "--"} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{weights.length ? "Último registro" : "Sin histórico"}</span>
              {weightDelta != null && (
                <span className={weightDelta < 0 ? "text-emerald-700" : weightDelta > 0 ? "text-rose-700" : ""}>
                  {weightDelta > 0 ? "+" : ""}{weightDelta} kg
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Droplets className="h-4 w-4" />
              <span className="text-xs font-medium">Agua</span>
            </div>
            <p className="text-2xl font-bold">{dailyLog?.waterLiters || 0} <span className="text-sm font-normal text-muted-foreground">L</span></p>
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Meta {waterTarget}L</span>
                <span>{waterProgress}%</span>
              </div>
              <Progress value={waterProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Meta</span>
            </div>
            <p className="text-2xl font-bold">{goal?.targetWeightKg || "--"} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
            {weightDirection && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                {weightDirection === "down" && <><TrendingDown className="h-3 w-3 mr-1" />Perder</>}
                {weightDirection === "up" && <><TrendingUp className="h-3 w-3 mr-1" />Ganar</>}
                {weightDirection === "even" && "Mantener"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Progreso</span>
            </div>
            <p className="text-2xl font-bold">
              {latestWeight != null && goal?.targetWeightKg != null ? Math.round(Math.abs(latestWeight - goal.targetWeightKg) * 10) / 10 : "--"}
              <span className="text-sm font-normal text-muted-foreground">kg</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">para llegar</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Peso (últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length < 2 ? (
            <p className="text-sm text-muted-foreground">Aún no hay suficientes registros de peso para mostrar el gráfico.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Min {minW}kg</span>
                <span>·</span>
                <span>Max {maxW}kg</span>
                {weightDelta != null && (
                  <>
                    <span>·</span>
                    <span>Último cambio {weightDelta > 0 ? "+" : ""}{weightDelta}kg</span>
                  </>
                )}
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fontSize: 12 }} width={36} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weightKg" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/Hoy">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
              <span className="text-lg">📊</span>
              <span className="text-xs">Hoy</span>
            </Button>
          </Link>
          <Link href="/nutricion">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
              <span className="text-lg">🥗</span>
              <span className="text-xs">Nutrición</span>
            </Button>
          </Link>
          <Link href="/entrenamiento">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
              <span className="text-lg">💪</span>
              <span className="text-xs">Entreno</span>
            </Button>
          </Link>
          <Link href="/compra">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
              <span className="text-lg">🛒</span>
              <span className="text-xs">Compra</span>
            </Button>
          </Link>
          <Link href="/calendario">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
              <span className="text-lg">📅</span>
              <span className="text-xs">Calendario</span>
            </Button>
          </Link>
          <Link href="/informes">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
              <span className="text-lg">📈</span>
              <span className="text-xs">Informes</span>
            </Button>
          </Link>
          <Link href="/recordatorios">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
              <span className="text-lg">🔔</span>
              <span className="text-xs">Avisos</span>
            </Button>
          </Link>
          <Link href="/perfil">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
              <span className="text-lg">👤</span>
              <span className="text-xs">Perfil</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {!profile && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-amber-800 mb-3">¡Completa tu perfil para comenzar!</p>
            <Link href="/perfil">
              <Button variant="default">Configurar perfil</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
