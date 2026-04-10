"use client"

import { useEffect, useState } from "react"
import { User, Scale, Target, Clock, Utensils, Dumbbell, Save, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

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
  onboardingCompleted: boolean
}

interface Goal {
  id: string
  targetWeightKg: number
  targetWeeks: number
  targetDate: string
  viabilityStatus: string
}

interface FormData {
  nombre: string
  edad: string
  altura: string
  peso: string
  sexo: "hombre" | "mujer"
  complexion: string
  pesoMeta: string
  fechaMeta: string
  tipoDieta: string
  alimentosNoPermitidos: string
  horaLevantarse: string
  horaAcostarse: string
  horaAlmorzar: string
  supermercado: string
  frecuenciaEntrenamiento: string
  lugarEntrenamiento: string[]
  equipamiento: string[]
}

const initialForm: FormData = {
  nombre: "",
  edad: "",
  altura: "",
  peso: "",
  sexo: "mujer",
  complexion: "",
  pesoMeta: "",
  fechaMeta: "",
  tipoDieta: "",
  alimentosNoPermitidos: "",
  horaLevantarse: "07:00",
  horaAcostarse: "23:00",
  horaAlmorzar: "14:00",
  supermercado: "",
  frecuenciaEntrenamiento: "",
  lugarEntrenamiento: [],
  equipamiento: [],
}

const tiposDieta = [
  "Mediterránea", "Vegetariana", "Vegana", "Keto", "Paleo",
  "Baja en carbohidratos", "Alta en proteínas", "Sin gluten", "Personalizada",
]

const supermercados = ["Mercadona", "Carrefour", "Lidl", "Aldi", "Dia", "Eroski", "Alcampo"]

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialForm)
  const [hasPlan, setHasPlan] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [profileRes, planRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/plan"),
      ])

      if (profileRes.ok) {
        const { profile, goal } = await profileRes.json()
        if (profile) {
          setFormData(prev => ({
            ...prev,
            edad: profile.age ? String(profile.age) : "",
            altura: profile.heightCm ? String(profile.heightCm) : "",
            peso: profile.weightKg ? String(profile.weightKg) : "",
            sexo: profile.sex === "hombre" ? "hombre" : "mujer",
            complexion: profile.bodyType || "",
            pesoMeta: goal?.targetWeightKg ? String(goal.targetWeightKg) : "",
            fechaMeta: goal?.targetDate ? goal.targetDate.split("T")[0] : "",
            tipoDieta: profile.dietType || "",
            alimentosNoPermitidos: profile.forbiddenFoods || "",
            horaLevantarse: profile.wakeUpTime || "07:00",
            horaAcostarse: profile.sleepTime || "23:00",
            horaAlmorzar: profile.lunchTime || "14:00",
            supermercado: profile.supermarket || "",
            frecuenciaEntrenamiento: profile.trainingFrequency || "",
            lugarEntrenamiento: JSON.parse(profile.trainingPlaces || "[]"),
            equipamiento: JSON.parse(profile.homeEquipment || "[]"),
          }))
        }
      }

      if (planRes.ok) {
        const data = await planRes.json()
        setHasPlan(!!data.plan)
      }

      const userRes = await fetch("/api/auth/me")
      if (userRes.ok) {
        const u = await userRes.json()
        setFormData(prev => ({ ...prev, nombre: u.user?.name || "" }))
      }

      setLoading(false)
    }
    load()
  }, [])

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    const pesoActual = Number(formData.peso)
    const pesoMeta = Number(formData.pesoMeta)
    const semanas = formData.fechaMeta 
      ? Math.ceil((new Date(formData.fechaMeta).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
      : Number(formData.pesoMeta) ? 12 : 12

    const payload = {
      name: formData.nombre,
      age: Number(formData.edad),
      height: Number(formData.altura),
      weight: Number(formData.peso),
      sex: formData.sexo,
      complexion: formData.complexion,
      pesoMeta: Number(formData.pesoMeta),
      tiempoMeta: semanas,
      tipoDieta: formData.tipoDieta,
      alimentosNoPermitidos: formData.alimentosNoPermitidos,
      horaLevantarse: formData.horaLevantarse,
      horaAcostarse: formData.horaAcostarse,
      horaAlmorzar: formData.horaAlmorzar,
      supermercado: formData.supermercado,
      frecuenciaEntrenamiento: formData.frecuenciaEntrenamiento,
      lugarEntrenamiento: formData.lugarEntrenamiento,
      equipamiento: formData.equipamiento,
    }

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }

  const generatePlan = async () => {
    await saveProfile()
    window.location.href = "/entrenamiento"
  }

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Perfil</h1>
        {saved && <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Guardado</Badge>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Datos personales
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label>Nombre</Label>
            <Input value={formData.nombre} onChange={(e) => updateField("nombre", e.target.value)} />
          </div>
          <div>
            <Label>Edad</Label>
            <Input type="number" value={formData.edad} onChange={(e) => updateField("edad", e.target.value)} />
          </div>
          <div>
            <Label>Altura (cm)</Label>
            <Input type="number" value={formData.altura} onChange={(e) => updateField("altura", e.target.value)} />
          </div>
          <div>
            <Label>Peso (kg)</Label>
            <Input type="number" value={formData.peso} onChange={(e) => updateField("peso", e.target.value)} />
          </div>
          <div>
            <Label>Sexo</Label>
            <Select value={formData.sexo} onValueChange={(v) => updateField("sexo", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mujer">Mujer</SelectItem>
                <SelectItem value="hombre">Hombre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Complexión</Label>
            <Select value={formData.complexion} onValueChange={(v) => updateField("complexion", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="delgada">Delgada</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="robusta">Robusta</SelectItem>
                <SelectItem value="atletica">Atlética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Peso objetivo (kg)</Label>
            <Input type="number" value={formData.pesoMeta} onChange={(e) => updateField("pesoMeta", e.target.value)} />
          </div>
          <div>
            <Label>Fecha objetivo</Label>
            <Input 
              type="date" 
              value={formData.fechaMeta} 
              onChange={(e) => updateField("fechaMeta", e.target.value)}
            />
          </div>
          {formData.peso && formData.pesoMeta && (
            <div className="col-span-2 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Diferencia: <span className="font-medium">{Math.abs(Number(formData.peso) - Number(formData.pesoMeta)).toFixed(1)} kg</span>
                {Number(formData.peso) > Number(formData.pesoMeta) ? " (perder)" : " (ganar)"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Rutina diaria
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <Label>Levantarse</Label>
            <Input type="time" value={formData.horaLevantarse} onChange={(e) => updateField("horaLevantarse", e.target.value)} />
          </div>
          <div>
            <Label>Almorzar</Label>
            <Input type="time" value={formData.horaAlmorzar} onChange={(e) => updateField("horaAlmorzar", e.target.value)} />
          </div>
          <div>
            <Label>Acostarse</Label>
            <Input type="time" value={formData.horaAcostarse} onChange={(e) => updateField("horaAcostarse", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Utensils className="h-4 w-4" /> Nutrición
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tipo de dieta</Label>
            <Select value={formData.tipoDieta} onValueChange={(v) => updateField("tipoDieta", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {tiposDieta.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Supermercado</Label>
            <Select value={formData.supermercado} onValueChange={(v) => updateField("supermercado", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {supermercados.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Alimentos a evitar</Label>
            <Textarea 
              value={formData.alimentosNoPermitidos} 
              onChange={(e) => updateField("alimentosNoPermitidos", e.target.value)}
              placeholder="Ej: mariscos, lácteos, frutos secos"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4" /> Entrenamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Frecuencia semanal</Label>
            <Select value={formData.frecuenciaEntrenamiento} onValueChange={(v) => updateField("frecuenciaEntrenamiento", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-2">1-2 veces</SelectItem>
                <SelectItem value="3-4">3-4 veces</SelectItem>
                <SelectItem value="5-6">5-6 veces</SelectItem>
                <SelectItem value="diario">Diario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Dónde entrenas</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {["Casa", "Gimnasio", "Exterior"].map(l => (
                <div key={l} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.lugarEntrenamiento.includes(l)}
                    onCheckedChange={(checked) => {
                      const current = formData.lugarEntrenamiento
                      updateField("lugarEntrenamiento", checked ? [...current, l] : current.filter(x => x !== l))
                    }}
                  />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
          </div>
          {formData.lugarEntrenamiento.includes("Casa") && (
            <div>
              <Label>Equipamiento en casa</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {["Pesas", "Gomas", "Esterilla", "Mancuernas", "Ninguno"].map(e => (
                  <div key={e} className="flex items-center gap-2">
                    <Checkbox 
                      checked={formData.equipamiento.includes(e)}
                      onCheckedChange={(checked) => {
                        const current = formData.equipamiento
                        updateField("equipamiento", checked ? [...current, e] : current.filter(x => x !== e))
                      }}
                    />
                    <Label>{e}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={saveProfile} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar perfil"}
        </Button>
        {!hasPlan && (
          <Button variant="secondary" onClick={generatePlan}>
            Generar plan
          </Button>
        )}
      </div>
    </div>
  )
}