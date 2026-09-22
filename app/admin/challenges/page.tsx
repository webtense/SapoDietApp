"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Challenge {
  id: string
  nombre: string
  tipo: string
  objetivo: number
  fechaInicio: string
  fechaFin: string
  status: string
  _count?: { participantes: number }
}

const TIPOS = [
  { value: "ENTRENAMIENTOS_SEMANA", label: "Entrenamientos/semana" },
  { value: "RACHA_DIAS", label: "Racha de días" },
  { value: "MINUTOS_ACTIVOS", label: "Minutos activos" },
  { value: "VOLUMEN_TOTAL", label: "Volumen total (no implementado)" },
]

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: "", tipo: "ENTRENAMIENTOS_SEMANA", objetivo: "", fechaInicio: "", fechaFin: "",
  })

  async function load() {
    setLoading(true)
    const res = await fetch("/api/social/challenges").then(r => r.json()).catch(() => ({ challenges: [] }))
    setChallenges(res.challenges ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function crear() {
    if (!form.nombre || !form.objetivo || !form.fechaInicio || !form.fechaFin) return
    setSaving(true)
    await fetch("/api/social/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        tipo: form.tipo,
        objetivo: Number(form.objetivo),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
      }),
    })
    setSaving(false)
    setForm({ nombre: "", tipo: "ENTRENAMIENTOS_SEMANA", objetivo: "", fechaInicio: "", fechaFin: "" })
    load()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">Retos sociales</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Crear reto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Objetivo</Label>
            <Input type="number" value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="date" value={form.fechaFin} onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))} />
            </div>
          </div>
          <Button onClick={crear} disabled={saving}>Crear reto</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {challenges.map(c => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{c.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {c.tipo} · objetivo {c.objetivo} · {c._count?.participantes ?? 0} participantes
                </p>
              </div>
              <Badge variant={c.status === "ACTIVO" ? "default" : "secondary"}>{c.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
