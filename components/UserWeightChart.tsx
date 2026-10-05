"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TrendingUp } from "lucide-react"

interface WeightEntry {
  id: string
  userId: string
  date: string
  weight: number
}

interface UserWeightChartProps {
  /** id del usuario (informativo; el endpoint usa la sesión actual) */
  userId?: string
  /** rango de días a mostrar: 30, 90 o 365 */
  days?: 30 | 90 | 365
}

const RANGE_OPTIONS: Array<30 | 90 | 365> = [30, 90, 365]

export default function UserWeightChart({ days: initialDays = 30 }: UserWeightChartProps) {
  const [days, setDays] = useState<30 | 90 | 365>(initialDays)
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/user/progress/weight?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setEntries(Array.isArray(data.entries) ? data.entries : [])
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [days])

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const chartData = entries
    .filter((e) => new Date(e.date).getTime() >= cutoff)
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
      weight: e.weight,
    }))

  return (
    <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" /> Evolución del peso
          </CardTitle>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt}
                size="sm"
                variant={days === opt ? "default" : "outline"}
                className={cn("h-7 px-2 text-xs")}
                onClick={() => setDays(opt)}
              >
                {opt}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay registros de peso en este rango.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" fontSize={12} stroke="rgba(0,0,0,0.5)" />
                <YAxis
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  fontSize={12}
                  stroke="rgba(0,0,0,0.5)"
                />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)} kg`} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#0369a1"
                  strokeWidth={2}
                  dot={{ fill: "#0369a1", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
