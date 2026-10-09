"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Flame, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GymAttendance {
  id: string
  date: string
  startTime: string
  endTime: string
  durationMin: number
  gym: string
}

interface Stats {
  totalSessions: number
  totalMinutes: number
  totalDays: number
  streak: number
  avgPerWeek: number
  avgDuration: number
  firstDate: string | null
  lastDate: string | null
  intensity: { last7: number; last14: number; last30: number }
}

export default function AsistenciasPage() {
  const [loading, setLoading] = useState(true)
  const [attendances, setAttendances] = useState<GymAttendance[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const load = async () => {
      const [attRes, statsRes] = await Promise.all([
        fetch("/api/user/gym-attendance?limit=100"),
        fetch("/api/user/gym-attendance/stats"),
      ])

      if (attRes.ok) {
        const data = await attRes.json()
        setAttendances(data.attendances)
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("es-ES", { weekday: "short", month: "short", day: "numeric" })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  }

  const monthsActive = stats && stats.firstDate && stats.lastDate
    ? Math.round((new Date(stats.lastDate).getTime() - new Date(stats.firstDate).getTime()) / (1000 * 60 * 60 * 24 * 30) * 10) / 10
    : 0

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      {/* Hero */}
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              Historial de asistencias
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Tu compromiso con el entreno</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-800">
              Seguimiento automático de cada sesión en el gimnasio. Visualiza tu progreso, racha y consistencia.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="rounded-2xl border-emerald-100 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-emerald-700 uppercase">Sesiones totales</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.totalSessions}</p>
              {stats.firstDate && stats.lastDate && (
                <p className="mt-1 text-xs text-emerald-700">{monthsActive} meses activo</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-emerald-100 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-emerald-700 uppercase">🔥 Racha actual</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.streak} días</p>
              <p className="mt-1 text-xs text-emerald-700">seguidos</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-emerald-100 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-emerald-700 uppercase">Promedio/semana</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.avgPerWeek}</p>
              <p className="mt-1 text-xs text-emerald-700">sesiones</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-emerald-100 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-emerald-700 uppercase">Duración promedio</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.avgDuration}min</p>
              <p className="mt-1 text-xs text-emerald-700">por sesión</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Intensidad reciente */}
      {stats && (
        <Card className="rounded-2xl border-white/70 bg-white/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Intensidad reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3">
              <span className="text-sm font-medium">Últimos 7 días</span>
              <Badge className="bg-emerald-600">{stats.intensity.last7} sesiones</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3">
              <span className="text-sm font-medium">Últimos 14 días</span>
              <Badge className="bg-emerald-600">{stats.intensity.last14} sesiones</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3">
              <span className="text-sm font-medium">Últimos 30 días</span>
              <Badge className="bg-emerald-600">{stats.intensity.last30} sesiones</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      <Card className="rounded-2xl border-white/70 bg-white/90 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Últimas sesiones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {attendances.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Sin asistencias registradas</p>
          ) : (
            attendances.map((att) => (
              <div key={att.id} className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{att.gym}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(att.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(att.startTime)} - {formatTime(att.endTime)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-sm">{att.durationMin}min</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
