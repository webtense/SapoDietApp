"use client"

import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, Dumbbell, HeartHandshake, Save, Sparkles, Target, User, UtensilsCrossed } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { defaultV3Preferences, parseV3Preferences, V3_PREFERENCES_KEY, type V3Preferences } from "@/lib/v3-preferences"

interface FormData {
  nombre: string
  telefono: string
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
  telefono: "",
  edad: "",
  altura: "",
  peso: "",
  sexo: "mujer",
  complexion: "media",
  pesoMeta: "",
  fechaMeta: "",
  tipoDieta: "Mediterránea",
  alimentosNoPermitidos: "",
  horaLevantarse: "07:00",
  horaAcostarse: "23:00",
  horaAlmorzar: "14:00",
  supermercado: "Mercadona",
  frecuenciaEntrenamiento: "3-4",
  lugarEntrenamiento: ["casa"],
  equipamiento: ["Sin material"],
}

const tiposDieta = ["Mediterránea", "Vegetariana", "Vegana", "Keto", "Alta en proteínas", "Baja en carbohidratos"]
const supermercados = ["Mercadona", "Carrefour", "Lidl", "Aldi", "Dia", "Eroski", "Alcampo"]
const objetivosPrincipales = ["Perder grasa", "Ganar masa muscular", "Mantenimiento", "Mejorar condición física"]
const durations = ["15", "30", "45", "60"]
const activityLevels = ["Sedentaria", "Ligera", "Moderada", "Alta"]
const experienceLevels = ["Principiante", "Intermedio", "Avanzado"]
const equipmentOptions = ["Sin material", "Bandas", "Mancuernas", "Gimnasio"]
const trainingPlacesOptions = ["casa", "aire libre", "gimnasio"]

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [planReady, setPlanReady] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialForm)
  const [v3, setV3] = useState<V3Preferences>(defaultV3Preferences)

  useEffect(() => {
    const load = async () => {
      const localPrefs = typeof window !== "undefined" ? window.localStorage.getItem(V3_PREFERENCES_KEY) : null
      if (localPrefs) {
        setV3(parseV3Preferences(JSON.parse(localPrefs)))
      }

      const [profileRes, planRes, userRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/plan"),
        fetch("/api/auth/me"),
      ])

      if (profileRes.ok) {
        const { profile, goal } = await profileRes.json()
        if (profile) {
          setFormData({
            nombre: "",
            telefono: "",
            edad: profile.age ? String(profile.age) : "",
            altura: profile.heightCm ? String(profile.heightCm) : "",
            peso: profile.weightKg ? String(profile.weightKg) : "",
            sexo: profile.sex === "hombre" ? "hombre" : "mujer",
            complexion: profile.bodyType || "media",
            pesoMeta: goal?.targetWeightKg ? String(goal.targetWeightKg) : "",
            fechaMeta: goal?.targetDate ? goal.targetDate.split("T")[0] : "",
            tipoDieta: profile.dietType || "Mediterránea",
            alimentosNoPermitidos: profile.forbiddenFoods || "",
            horaLevantarse: profile.wakeUpTime || "07:00",
            horaAcostarse: profile.sleepTime || "23:00",
            horaAlmorzar: profile.lunchTime || "14:00",
            supermercado: profile.supermarket || "Mercadona",
            frecuenciaEntrenamiento: profile.trainingFrequency || "3-4",
            lugarEntrenamiento: JSON.parse(profile.trainingPlaces || '["casa"]'),
            equipamiento: JSON.parse(profile.homeEquipment || '["Sin material"]'),
          })
        }
      }

      if (planRes.ok) {
        const data = await planRes.json()
        setPlanReady(!!data.plan)
      }

      if (userRes.ok) {
        const u = await userRes.json()
        setFormData((prev) => ({ 
          ...prev, 
          nombre: u.user?.name || prev.nombre,
          telefono: u.user?.phone || prev.telefono 
        }))
      }

      setLoading(false)
    }

    load()
  }, [])

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const toggleListValue = (field: "lugarEntrenamiento" | "equipamiento", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((item) => item !== value) : [...prev[field], value],
    }))
    setSaved(false)
  }

  const updateV3 = <K extends keyof V3Preferences>(field: K, value: V3Preferences[K]) => {
    setV3((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const saveProfile = async () => {
    setSaving(true)

    const semanas = formData.fechaMeta
      ? Math.max(2, Math.ceil((new Date(formData.fechaMeta).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
      : 12

    const mergedForbiddenFoods = [formData.alimentosNoPermitidos, v3.allergies, v3.excludedIngredients]
      .filter(Boolean)
      .join(", ")

    const payload = {
      name: formData.nombre,
      phone: formData.telefono,
      age: Number(formData.edad),
      height: Number(formData.altura),
      weight: Number(formData.peso),
      sex: formData.sexo,
      complexion: formData.complexion,
      pesoMeta: formData.pesoMeta ? Number(formData.pesoMeta) : undefined,
      tiempoMeta: semanas,
      targetDate: formData.fechaMeta || undefined,
      tipoDieta: formData.tipoDieta,
      alimentosNoPermitidos: mergedForbiddenFoods,
      horaLevantarse: formData.horaLevantarse,
      horaAcostarse: formData.horaAcostarse,
      horaAlmorzar: formData.horaAlmorzar,
      supermercado: formData.supermercado,
      frecuenciaEntrenamiento: formData.frecuenciaEntrenamiento,
      lugarEntrenamiento: formData.lugarEntrenamiento,
      equipamiento: Array.from(new Set([...formData.equipamiento, ...v3.equipmentProfile])),
    }

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      window.localStorage.setItem(V3_PREFERENCES_KEY, JSON.stringify(v3))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
    return res.ok
  }

  const generatePlan = async () => {
    const ok = await saveProfile()
    if (!ok) return

    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true }),
    })

    if (res.ok) {
      setPlanReady(true)
      window.location.href = "/Hoy"
    }
  }

  const onboardingSteps = [
    { title: "Biometría", done: !!(formData.edad && formData.altura && formData.peso) },
    { title: "Objetivo", done: !!(formData.pesoMeta && v3.primaryGoal) },
    { title: "Nutrición", done: !!(formData.tipoDieta && formData.supermercado) },
    { title: "Entrenamiento", done: formData.lugarEntrenamiento.length > 0 && formData.equipamiento.length > 0 },
  ]

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(80,200,120,0.18),_rgba(255,255,255,0.95))] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700">Onboarding v3</div>
            <h1 className="text-3xl font-semibold tracking-tight">Perfil y setup inicial</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Hemos convertido el perfil en un onboarding más completo para ajustar dieta, logística diaria y entrenamiento sin perder compatibilidad con tu plan actual.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            {saved && (
              <Badge className="bg-emerald-500 text-white">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Guardado
              </Badge>
            )}
            {planReady && <Badge variant="secondary">Plan activo</Badge>}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {onboardingSteps.map((step) => (
            <div key={step.title} className="rounded-2xl bg-white/80 p-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Paso</p>
              <p className="mt-1 font-medium">{step.title}</p>
              <p className={`mt-2 text-xs font-medium ${step.done ? "text-emerald-700" : "text-amber-700"}`}>
                {step.done ? "Completo" : "Pendiente"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Datos biométricos</CardTitle>
              <CardDescription>Base para calcular calorías, macros y evolución.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div><Label>Nombre</Label><Input value={formData.nombre} onChange={(e) => updateField("nombre", e.target.value)} /></div>
              <div><Label>Teléfono (WhatsApp)</Label><Input type="tel" value={formData.telefono} onChange={(e) => updateField("telefono", e.target.value)} placeholder="+34 612 345 678" /></div>
              <div><Label>Edad</Label><Input type="number" value={formData.edad} onChange={(e) => updateField("edad", e.target.value)} /></div>
              <div><Label>Sexo</Label><Select value={formData.sexo} onValueChange={(v: "hombre" | "mujer") => updateField("sexo", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mujer">Mujer</SelectItem><SelectItem value="hombre">Hombre</SelectItem></SelectContent></Select></div>
              <div><Label>Altura (cm)</Label><Input type="number" value={formData.altura} onChange={(e) => updateField("altura", e.target.value)} /></div>
              <div><Label>Peso actual (kg)</Label><Input type="number" value={formData.peso} onChange={(e) => updateField("peso", e.target.value)} /></div>
              <div><Label>Peso objetivo (kg)</Label><Input type="number" value={formData.pesoMeta} onChange={(e) => updateField("pesoMeta", e.target.value)} /></div>
              <div><Label>Fecha objetivo</Label><Input type="date" value={formData.fechaMeta} onChange={(e) => updateField("fechaMeta", e.target.value)} /></div>
              <div><Label>Complexión</Label><Select value={formData.complexion} onValueChange={(v) => updateField("complexion", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="delgada">Delgada</SelectItem><SelectItem value="media">Media</SelectItem><SelectItem value="robusta">Robusta</SelectItem><SelectItem value="atletica">Atlética</SelectItem></SelectContent></Select></div>
              <div><Label>Objetivo principal</Label><Select value={v3.primaryGoal} onValueChange={(v) => updateV3("primaryGoal", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{objetivosPrincipales.map((goal) => <SelectItem key={goal} value={goal}>{goal}</SelectItem>)}</SelectContent></Select></div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UtensilsCrossed className="h-4 w-4" /> Nutrición y logística</CardTitle>
              <CardDescription>Preferencias reales de cocina, compra y comidas para llevar.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Tipo de dieta</Label><Select value={formData.tipoDieta} onValueChange={(v) => updateField("tipoDieta", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tiposDieta.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Supermercado principal</Label><Select value={formData.supermercado} onValueChange={(v) => updateField("supermercado", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{supermercados.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Alergias o intolerancias</Label><Textarea rows={2} value={v3.allergies} onChange={(e) => updateV3("allergies", e.target.value)} placeholder="Ej: lactosa, marisco" /></div>
              <div><Label>Ingredientes a excluir</Label><Textarea rows={2} value={v3.excludedIngredients} onChange={(e) => updateV3("excludedIngredients", e.target.value)} placeholder="Ej: cebolla, cilantro" /></div>
              <div className="md:col-span-2"><Label>Alimentos a evitar del plan base</Label><Textarea rows={2} value={formData.alimentosNoPermitidos} onChange={(e) => updateField("alimentosNoPermitidos", e.target.value)} placeholder="Ej: frutos secos, picante" /></div>
              <div><Label>Comensales</Label><Input type="number" min={1} value={String(v3.householdSize)} onChange={(e) => updateV3("householdSize", Math.max(1, Number(e.target.value) || 1))} /></div>
              <div><Label>Hora comida principal</Label><Input type="time" value={formData.horaAlmorzar} onChange={(e) => updateField("horaAlmorzar", e.target.value)} /></div>
              <div className="rounded-2xl border p-4">
                <div className="flex items-start gap-3"><Checkbox checked={v3.hasAirfryer} onCheckedChange={(checked) => updateV3("hasAirfryer", !!checked)} /><div><p className="font-medium">Tengo Airfryer</p><p className="text-sm text-muted-foreground">El plan priorizará preparaciones rápidas y versiones alternativas.</p></div></div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="flex items-start gap-3"><Checkbox checked={v3.needsTupperMeals} onCheckedChange={(checked) => updateV3("needsTupperMeals", !!checked)} /><div><p className="font-medium">Necesito comida para llevar</p><p className="text-sm text-muted-foreground">Se priorizan recetas aptas para batch cooking y recalentado.</p></div></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Perfil de entrenamiento</CardTitle>
              <CardDescription>Nivel, frecuencia y entorno real de tus sesiones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div><Label>Nivel</Label><Select value={v3.experienceLevel} onValueChange={(v) => updateV3("experienceLevel", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{experienceLevels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Días por semana</Label><Select value={v3.daysPerWeek} onValueChange={(v) => updateV3("daysPerWeek", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem><SelectItem value="5">5</SelectItem><SelectItem value="6">6</SelectItem></SelectContent></Select></div>
                <div><Label>Duración preferida</Label><Select value={v3.sessionDuration} onValueChange={(v) => updateV3("sessionDuration", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{durations.map((item) => <SelectItem key={item} value={item}>{item} min</SelectItem>)}</SelectContent></Select></div>
              </div>

              <div>
                <Label>Lugar de entrenamiento</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trainingPlacesOptions.map((item) => (
                    <button key={item} type="button" onClick={() => toggleListValue("lugarEntrenamiento", item)} className={`rounded-full border px-3 py-2 text-sm ${formData.lugarEntrenamiento.includes(item) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "bg-white"}`}>{item}</button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Equipamiento disponible</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {equipmentOptions.map((item) => (
                    <button key={item} type="button" onClick={() => {
                      toggleListValue("equipamiento", item)
                      updateV3("equipmentProfile", v3.equipmentProfile.includes(item) ? v3.equipmentProfile.filter((current) => current !== item) : [...v3.equipmentProfile.filter((current) => current !== "Sin material"), item])
                    }} className={`rounded-full border px-3 py-2 text-sm ${formData.equipamiento.includes(item) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "bg-white"}`}>{item}</button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Estilo de vida y social</CardTitle>
              <CardDescription>Preferencias que influyen en hábitos y adherencia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Actividad diaria</Label><Select value={v3.activityLevel} onValueChange={(v) => updateV3("activityLevel", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activityLevels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Hora de levantarse</Label><Input type="time" value={formData.horaLevantarse} onChange={(e) => updateField("horaLevantarse", e.target.value)} /></div>
              <div><Label>Hora de acostarse</Label><Input type="time" value={formData.horaAcostarse} onChange={(e) => updateField("horaAcostarse", e.target.value)} /></div>
              <div className="rounded-2xl border p-4">
                <div className="flex items-start gap-3"><Checkbox checked={v3.coupleMode} onCheckedChange={(checked) => updateV3("coupleMode", !!checked)} /><div><p className="font-medium">Modo pareja / dúo</p><p className="text-sm text-muted-foreground">Deja preparada la experiencia social de retos y seguimiento compartido.</p></div></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(80,200,120,0.08))] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Resumen v3</CardTitle>
              <CardDescription>Lo que usará SapoFit para personalizar tu siguiente versión de plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl bg-white/85 p-4">
                <p className="font-medium">Objetivo</p>
                <p className="mt-1 text-muted-foreground">{v3.primaryGoal} con dieta {formData.tipoDieta.toLowerCase()} y {v3.householdSize} comensal(es).</p>
              </div>
              <div className="rounded-2xl bg-white/85 p-4">
                <p className="font-medium">Logística</p>
                <p className="mt-1 text-muted-foreground">{v3.hasAirfryer ? "Con Airfryer" : "Sin Airfryer"} · {v3.needsTupperMeals ? "Comidas aptas para tupper" : "Comidas para casa"}.</p>
              </div>
              <div className="rounded-2xl bg-white/85 p-4">
                <p className="font-medium">Entrenamiento</p>
                <p className="mt-1 text-muted-foreground">Nivel {v3.experienceLevel.toLowerCase()}, {v3.daysPerWeek} días por semana y sesiones de {v3.sessionDuration} minutos.</p>
              </div>
              <div className="rounded-2xl bg-white/85 p-4">
                <p className="font-medium">Social y hábitos</p>
                <p className="mt-1 text-muted-foreground">Actividad {v3.activityLevel.toLowerCase()} {v3.coupleMode ? "con modo pareja activado" : "sin modo pareja"}.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <Button className="h-12 w-full rounded-2xl" onClick={saveProfile} disabled={saving}>
                <Save className="mr-2 h-4 w-4" /> Guardar onboarding
              </Button>
              <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={generatePlan} disabled={saving}>
                Generar plan v3 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Qué se ha activado ya</p>
                <p className="mt-1">Persistimos el núcleo del perfil en backend y las nuevas preferencias v3 en local para enriquecer la experiencia mientras se amplía el modelo de datos.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> Próxima fase v3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>IA efímera para análisis fotográfico de comidas.</p>
              <p>Retos sociales con privacidad de tendencia y calendario.</p>
              <p>Tokens IA y controles operativos desde admin.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
