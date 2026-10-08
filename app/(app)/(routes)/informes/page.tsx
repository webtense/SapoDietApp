"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Dumbbell, Flame, TrendingDown, TrendingUp, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface WorkoutSummary {
  id: string
  date: string
  completedAt: string | null
  planType: string | null
  durationMinutes: number | null
  exercises: string[]
  setsCount: number
  volume: number
}

interface PeriodStats {
  workoutsCompleted: number
  workoutsTotal: number
  volume: number
  prs: number
  topMuscleGroup: string | null
}

interface WeeklyAdherence {
  week: string
  completed: number
  planned: number
  pct: number
}

interface WorkoutStatsResponse {
  current: PeriodStats
  previous: PeriodStats
  weeklyAdherence: WeeklyAdherence[]
}

const PERIOD_OPTIONS = [
  { value: "7", label: "Última semana" },
  { value: "14", label: "Últimas 2 semanas" },
  { value: "30", label: "Último mes" },
  { value: "90", label: "Último trimestre" },
]

const MUSCLE_GROUP_LABEL: Record<string, string> = {
  UPPER: "Tren superior",
  LOWER: "Tren inferior",
  FULL: "Cuerpo completo",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  const diff = current - previous
  if (diff === 0) {
    return <span className="text-xs text-muted-foreground">= vs. semana anterior</span>
  }
  const up = diff > 0
  return (
    <span className={`flex items-center gap-1 text-xs ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {diff} vs. periodo anterior
    </span>
  )
}

export default function InformesPage() {
  const router = useRouter()
  const [period, setPeriod] = useState("7")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([])
  const [stats, setStats] = useState<WorkoutStatsResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [workoutsRes, statsRes] = await Promise.all([
          fetch(`/api/user/workouts?days=${period}&take=10`),
          fetch(`/api/user/workout-stats?days=${period}`),
        ])
        if (!workoutsRes.ok || !statsRes.ok) throw new Error("No se pudieron cargar los informes")
        const workoutsData = await workoutsRes.json()
        const statsData = await statsRes.json()
        if (cancelled) return
        setWorkouts(workoutsData.workouts ?? [])
        setStats(statsData)
      } catch {
        if (!cancelled) setError("No se pudieron cargar los datos de entrenamiento")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [period])

  const adherencePct = useMemo(() => {
    if (!stats || stats.current.workoutsTotal === 0) return 0
    return Math.round((stats.current.workoutsCompleted / stats.current.workoutsTotal) * 100)
  }, [stats])

  const hasData = workouts.length > 0 || (stats?.current.workoutsTotal ?? 0) > 0

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Hero */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Informes</h1>
            <p className="text-sm text-emerald-800/80">
              Tu resumen de entrenamientos, nutrición y progreso
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px] rounded-2xl bg-white">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-sm text-muted-foreground">Cargando informes…</div>
      )}

      {!loading && error && (
        <Card className="rounded-2xl border-red-100">
          <CardContent className="p-6 text-center text-sm text-red-600">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && !hasData && (
        <Card className="rounded-2xl border-emerald-100">
          <CardContent className="p-8 text-center space-y-2">
            <Dumbbell className="h-8 w-8 mx-auto text-emerald-400" />
            <p className="text-sm text-muted-foreground">
              Aún no hay entrenamientos registrados en este periodo.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && hasData && stats && (
        <>
          {/* Resumen del periodo: 4 cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="rounded-2xl border-emerald-100">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs font-medium">Entrenamientos</span>
                </div>
                <p className="text-2xl font-bold">
                  {stats.current.workoutsCompleted}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{stats.current.workoutsTotal}
                  </span>
                </p>
                <Badge variant={adherencePct >= 70 ? "default" : "secondary"}>{adherencePct}%</Badge>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-emerald-100">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-amber-600">
                  <Flame className="h-4 w-4" />
                  <span className="text-xs font-medium">Volumen total</span>
                </div>
                <p className="text-2xl font-bold">{stats.current.volume.toLocaleString("es-ES")}</p>
                <p className="text-xs text-muted-foreground">kg × reps × series</p>
                <Trend current={stats.current.volume} previous={stats.previous.volume} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-emerald-100">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-blue-600">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium">PRs esta semana</span>
                </div>
                <p className="text-2xl font-bold">{stats.current.prs}</p>
                <Trend current={stats.current.prs} previous={stats.previous.prs} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-emerald-100">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-purple-600">
                  <Dumbbell className="h-4 w-4" />
                  <span className="text-xs font-medium">Grupo más trabajado</span>
                </div>
                <p className="text-lg font-bold">
                  {stats.current.topMuscleGroup
                    ? MUSCLE_GROUP_LABEL[stats.current.topMuscleGroup] ?? stats.current.topMuscleGroup
                    : "--"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfica de adherencia */}
          <Card className="rounded-2xl border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Adherencia — últimas 4 semanas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyAdherence} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={12} unit="%" />
                    <Tooltip formatter={(value) => [`${value}%`, "Adherencia"]} />
                    <Legend />
                    <ReferenceLine y={100} stroke="#a3a3a3" strokeDasharray="4 4" label={{ value: "Meta", fontSize: 11, position: "right" }} />
                    <Bar dataKey="pct" name="% completado" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparación periodo anterior */}
          {(stats.previous.workoutsTotal > 0 || stats.previous.volume > 0) && (
            <Card className="rounded-2xl border-emerald-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comparación con el periodo anterior</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Entrenamientos</p>
                  <p className="text-lg font-semibold">{stats.previous.workoutsCompleted}</p>
                  <Trend current={stats.current.workoutsCompleted} previous={stats.previous.workoutsCompleted} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volumen</p>
                  <p className="text-lg font-semibold">{stats.previous.volume.toLocaleString("es-ES")}</p>
                  <Trend current={stats.current.volume} previous={stats.previous.volume} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PRs</p>
                  <p className="text-lg font-semibold">{stats.previous.prs}</p>
                  <Trend current={stats.current.prs} previous={stats.previous.prs} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Últimos entrenamientos */}
          <Card className="rounded-2xl border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Últimos entrenamientos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workouts.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay entrenamientos recientes.</p>
              )}
              {workouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => router.push(`/entrenamiento?sessionId=${w.id}`)}
                  className="w-full text-left rounded-2xl border border-emerald-100 p-3 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{formatDate(w.date)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(w.date)}</span>
                      {w.planType && (
                        <Badge variant="secondary" className="text-[10px]">
                          Plan {w.planType}
                        </Badge>
                      )}
                      {!w.completedAt && (
                        <Badge variant="outline" className="text-[10px]">
                          Incompleto
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {w.exercises.length > 0 ? w.exercises.join(", ") : "Sin ejercicios registrados"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{w.volume.toLocaleString("es-ES")} kg</p>
                    <p className="text-xs text-muted-foreground">
                      {w.durationMinutes ? `${w.durationMinutes} min` : `${w.setsCount} series`}
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
