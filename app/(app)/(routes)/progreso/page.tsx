"use client"

import { useEffect, useState } from "react"
import { Scale, Ruler, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"

interface WeightEntry { id: string; date: string; weightKg: number }
interface MeasurementEntry {
  id: string
  date: string
  waistCm: number | null
  chestCm: number | null
  hipsCm: number | null
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function ProgresoPage() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [weightForm, setWeightForm] = useState({ date: todayStr(), weightKg: "" })
  const [measureForm, setMeasureForm] = useState({
    date: todayStr(), waistCm: "", chestCm: "", hipsCm: "",
  })

  async function load() {
    setLoading(true)
    const [w, m] = await Promise.all([
      fetch("/api/user/progress/weight").then(r => r.json()).catch(() => ({ entries: [] })),
      fetch("/api/user/progress/measurements").then(r => r.json()).catch(() => ({ entries: [] })),
    ])
    setWeightEntries(w.entries ?? [])
    setMeasurements(m.entries ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function submitWeight() {
    if (!weightForm.weightKg) return
    setSaving(true)
    await fetch("/api/user/progress/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: weightForm.date, weightKg: Number(weightForm.weightKg) }),
    })
    setSaving(false)
    setWeightForm({ date: todayStr(), weightKg: "" })
    load()
  }

  async function submitMeasurements() {
    setSaving(true)
    await fetch("/api/user/progress/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: measureForm.date,
        waistCm: measureForm.waistCm ? Number(measureForm.waistCm) : undefined,
        chestCm: measureForm.chestCm ? Number(measureForm.chestCm) : undefined,
        hipsCm: measureForm.hipsCm ? Number(measureForm.hipsCm) : undefined,
      }),
    })
    setSaving(false)
    setMeasureForm({ date: todayStr(), waistCm: "", chestCm: "", hipsCm: "" })
    load()
  }

  const weightChartData = weightEntries.map(e => ({
    date: e.date.slice(5, 10),
    peso: e.weightKg,
  }))

  const waistChartData = measurements
    .filter(m => m.waistCm != null)
    .map(m => ({ date: m.date.slice(5, 10), cintura: m.waistCm }))

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">Seguimiento corporal</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5 text-primary" /> Registrar peso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={weightForm.date}
                onChange={e => setWeightForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" value={weightForm.weightKg}
                onChange={e => setWeightForm(f => ({ ...f, weightKg: e.target.value }))} />
            </div>
          </div>
          <Button onClick={submitWeight} disabled={saving}>Guardar peso</Button>

          {weightChartData.length > 0 && (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData}>
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis domain={["auto", "auto"]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="peso" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="h-5 w-5 text-primary" /> Registrar medidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={measureForm.date}
                onChange={e => setMeasureForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label>Cintura (cm)</Label>
              <Input type="number" step="0.1" value={measureForm.waistCm}
                onChange={e => setMeasureForm(f => ({ ...f, waistCm: e.target.value }))} />
            </div>
            <div>
              <Label>Pecho (cm)</Label>
              <Input type="number" step="0.1" value={measureForm.chestCm}
                onChange={e => setMeasureForm(f => ({ ...f, chestCm: e.target.value }))} />
            </div>
            <div>
              <Label>Cadera (cm)</Label>
              <Input type="number" step="0.1" value={measureForm.hipsCm}
                onChange={e => setMeasureForm(f => ({ ...f, hipsCm: e.target.value }))} />
            </div>
          </div>
          <Button onClick={submitMeasurements} disabled={saving}>Guardar medidas</Button>

          {waistChartData.length > 0 && (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waistChartData}>
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis domain={["auto", "auto"]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cintura" stroke="var(--color-info)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
