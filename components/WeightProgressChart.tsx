'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale } from 'lucide-react'

interface WeightEntry {
  date: string
  weight: number
}

export default function WeightProgressChart() {
  const [data, setData] = useState<WeightEntry[]>([])
  const [lastWeight, setLastWeight] = useState<{ weight: number; date: string } | null>(null)

  useEffect(() => {
    const loadWeightData = async () => {
      try {
        const res = await fetch('/api/user/weight')
        const json = await res.json()

        if (json.ok && json.entries && json.entries.length > 0) {
          const sorted = [...json.entries].sort((a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )

          // Últimos 30 días
          const last30 = sorted.slice(-30).map((e: any) => ({
            date: new Date(e.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
            weight: e.weight,
            fullDate: e.date
          }))

          setData(last30)
          if (sorted.length > 0) {
            const last = sorted[sorted.length - 1]
            setLastWeight({
              weight: last.weight,
              date: new Date(last.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            })
          }
        }
      } catch (error) {
        console.debug('Weight data error:', error)
      }
    }

    loadWeightData()
  }, [])

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-blue-600" />
            Progreso de Peso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Registra tu peso para ver el progreso</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-blue-600" />
            Progreso de Peso
          </CardTitle>
          {lastWeight && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{lastWeight.weight.toFixed(1)} kg</div>
              <div className="text-xs text-muted-foreground">{lastWeight.date}</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="date"
                fontSize={12}
                stroke="rgba(0,0,0,0.5)"
              />
              <YAxis
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                fontSize={12}
                stroke="rgba(0,0,0,0.5)"
              />
              <Tooltip
                formatter={(value) => `${Number(value).toFixed(1)} kg`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#0369a1"
                strokeWidth={2}
                dot={{ fill: '#0369a1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {data.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Actual</div>
              <div className="font-semibold text-blue-600">
                {data[data.length - 1].weight.toFixed(1)} kg
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Hace 30 días</div>
              <div className="font-semibold">
                {data[0].weight.toFixed(1)} kg
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Cambio</div>
              <div className={`font-semibold ${
                data[data.length - 1].weight < data[0].weight
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {(data[data.length - 1].weight - data[0].weight).toFixed(1)} kg
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
