"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Dumbbell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Group = "UPPER" | "LOWER" | "FULL" | "REST"

interface DaySchedule {
  weekday: number
  group: Group
  label: string | null
}

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const ORDERED_WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]

const GROUP_OPTIONS: { value: Group; label: string }[] = [
  { value: "UPPER", label: "Tren Superior" },
  { value: "LOWER", label: "Tren Inferior" },
  { value: "FULL", label: "Full" },
  { value: "REST", label: "Descanso" },
]

export default function CalendarioEntrenoPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [days, setDays] = useState<Record<number, DaySchedule>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/workout/schedule")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el calendario")
      const map: Record<number, DaySchedule> = {}
      for (const day of data.days as DaySchedule[]) {
        map[day.weekday] = { weekday: day.weekday, group: day.group, label: day.label }
      }
      setDays(map)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando el calendario")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function updateGroup(weekday: number, group: Group) {
    setDays((prev) => ({ ...prev, [weekday]: { ...prev[weekday], weekday, group } }))
  }

  function updateLabel(weekday: number, label: string) {
    setDays((prev) => ({ ...prev, [weekday]: { ...prev[weekday], weekday, label } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = Array.from({ length: 7 }, (_, weekday) => {
        const day = days[weekday] || { weekday, group: "REST" as Group, label: null }
        return { weekday, group: day.group, label: day.label?.trim() || null }
      })
      const res = await fetch("/api/workout/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar el calendario")
      toast.success("Calendario guardado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando el calendario")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando calendario...</div>
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" /> Calendario de entreno
          </CardTitle>
          <CardDescription>
            Define qué toca cada día. A la hora de tu recordatorio recibirás un aviso motivacional según lo que hayas
            planificado.
          </CardDescription>
        </CardHeader>
      </Card>

      {ORDERED_WEEKDAYS.map((weekday) => {
        const day = days[weekday] || { weekday, group: "REST" as Group, label: null }
        return (
          <Card key={weekday} className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardContent className="pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">{WEEKDAY_NAMES[weekday]}</p>
                {day.group !== "REST" && <Badge className="bg-emerald-500 text-white">Entreno</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GROUP_OPTIONS.map((option) => {
                  const active = day.group === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateGroup(weekday, option.value)}
                      className={`rounded-2xl border-2 p-2 text-center text-xs font-semibold transition-all ${
                        active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {day.group !== "REST" && (
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Personaliza el título del aviso (opcional)</Label>
                  <Input
                    value={day.label || ""}
                    onChange={(e) => updateLabel(weekday, e.target.value)}
                    placeholder="Ej: Día de piernas, Push day..."
                    maxLength={60}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Guardando..." : "Guardar calendario"}
      </Button>
    </div>
  )
}
