"use client"

import { useEffect, useState } from "react"
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChartNoAxesCombined } from "lucide-react"

interface ExerciseHistoryResponse {
  ok: boolean
  dates: string[]
  maxWeight: (number | null)[]
  weeklyVolume: number[]
  estimatedOneRM: (number | null)[]
  sufficientData: boolean
}

const RANGE_OPTIONS: Array<30 | 90 | 365> = [30, 90, 365]

interface MachineEvolutionChartProps {
  exerciseId: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
}

export function MachineEvolutionChart({ exerciseId }: MachineEvolutionChartProps) {
  const [range, setRange] = useState<30 | 90 | 365>(30)
  const [data, setData] = useState<ExerciseHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/user/workout/exercise/${exerciseId}/history?range=${range}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [exerciseId, range])

  const chartData =
    data?.dates.map((date, i) => ({
      date: formatDate(date),
      pesoMax: data.maxWeight[i],
      oneRM: data.estimatedOneRM[i],
    })) ?? []

  // El volumen semanal tiene menos puntos que los diarios; se muestra aparte.
  const volumeData = data?.weeklyVolume.map((v, i) => ({ semana: i + 1, volumen: v })) ?? []

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ChartNoAxesCombined className="h-3.5 w-3.5" /> Evolución
        </span>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt}
              type="button"
              size="sm"
              variant={range === opt ? "default" : "outline"}
              className={cn("h-6 px-2 text-[11px]")}
              onClick={() => setRange(opt)}
            >
              {opt}d
            </Button>
          ))}
        </div>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Cargando…</p>}

      {!loading && (!data || !data.sufficientData) && (
        <p className="text-xs text-muted-foreground">Sin datos suficientes todavía (mínimo 3 registros).</p>
      )}

      {!loading && data?.sufficientData && (
        <>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} domain={["auto", "auto"]} />
                <Tooltip formatter={(value: number) => `${Number(value).toFixed(1)} kg`} />
                <Line type="monotone" dataKey="pesoMax" name="Peso máximo" stroke="#0369a1" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="oneRM" name="1RM estimado" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {volumeData.length > 0 && (
            <div className="h-24 w-full">
              <p className="mb-1 text-[11px] text-muted-foreground">Volumen semanal (kg totales)</p>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volumeData}>
                  <XAxis dataKey="semana" fontSize={10} tickFormatter={(v) => `S${v}`} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value: number) => `${Number(value).toFixed(0)} kg`} />
                  <Area type="monotone" dataKey="volumen" name="Volumen" fill="#0369a133" stroke="#0369a1" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
