"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut, Target, TrendingDown, TrendingUp, Scale, Droplets } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export default function InicioPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [userRes, profileRes, dailyRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/profile"),
        fetch("/api/tracking?type=daily"),
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
      setLoading(false)
    }
    load()
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  const weightDiff = profile && goal ? profile.weightKg - goal.targetWeightKg : null
  const weightDirection = weightDiff !== null ? (weightDiff > 0 ? "down" : weightDiff < 0 ? "up" : "even") : null

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
            <p className="text-2xl font-bold">{profile?.weightKg || "--"} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
            {dailyLog?.weightKg && <p className="text-xs text-muted-foreground mt-1">Hoy: {dailyLog.weightKg} kg</p>}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Droplets className="h-4 w-4" />
              <span className="text-xs font-medium">Agua</span>
            </div>
            <p className="text-2xl font-bold">{dailyLog?.waterLiters || 0} <span className="text-sm font-normal text-muted-foreground">L</span></p>
            <p className="text-xs text-muted-foreground mt-1">Meta: 2.5L</p>
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
              {profile && goal ? Math.round(Math.abs(profile.weightKg - goal.targetWeightKg) * 10) / 10 : "--"}
              <span className="text-sm font-normal text-muted-foreground">kg</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">para llegar</p>
          </CardContent>
        </Card>
      </div>

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