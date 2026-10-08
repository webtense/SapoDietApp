"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  LogOut,
  Pill,
  Ruler,
  Save,
  Scale,
  Smartphone,
  Sparkles,
  Target,
  User,
  UtensilsCrossed,
  Watch,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import EditableCard from "@/components/EditableCard"
import WeightProgressChart from "@/components/WeightProgressChart"
import UserWeightChart from "@/components/UserWeightChart"
import ConnectWatchCard from "@/components/ConnectWatchCard"
import { defaultV3Preferences, parseV3Preferences, V3_PREFERENCES_KEY, type V3Preferences } from "@/lib/v3-preferences"
import { SUPPLEMENT_BRANDS, SUPPLEMENTS_KEY } from "@/lib/supplements"
import { PaywallDialog } from "@/components/paywall-dialog"

interface WeightEntry { id: string; date: string; weight: number }
interface MeasurementEntry {
  date: string
  waistCm?: number | null
  chestCm?: number | null
  hipsCm?: number | null
  leftArmCm?: number | null
  rightArmCm?: number | null
  leftThighCm?: number | null
  rightThighCm?: number | null
  neckCm?: number | null
  leftCalfCm?: number | null
  rightCalfCm?: number | null
}

const MEASUREMENT_FIELDS: { key: keyof MeasurementEntry; label: string }[] = [
  { key: "waistCm", label: "Cintura" },
  { key: "chestCm", label: "Pecho" },
  { key: "hipsCm", label: "Cadera" },
  { key: "leftArmCm", label: "Brazo izq." },
  { key: "rightArmCm", label: "Brazo der." },
  { key: "leftThighCm", label: "Muslo izq." },
  { key: "rightThighCm", label: "Muslo der." },
  { key: "neckCm", label: "Cuello" },
  { key: "leftCalfCm", label: "Gemelo izq." },
  { key: "rightCalfCm", label: "Gemelo der." },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

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

const APP_VERSION = "v1.0.0"

type SectionKey =
  | "biometria"
  | "objetivo"
  | "entrenamiento"
  | "nutricion"
  | "salud"
  | "suplementos"
  | "planes"
  | "resumen"

interface SectionDef {
  key: SectionKey
  icon: React.ReactNode
  title: string
  description: string
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [planReady, setPlanReady] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialForm)
  const [v3, setV3] = useState<V3Preferences>(defaultV3Preferences)
  const [supplementBrand, setSupplementBrand] = useState<string>("")
  const [userEmail, setUserEmail] = useState("")
  const [pricingLabel, setPricingLabel] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const [expandedSection, setExpandedSection] = useState<SectionKey>("biometria")

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [weightToday, setWeightToday] = useState("")
  const [savingWeight, setSavingWeight] = useState(false)

  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([])
  const [measureForm, setMeasureForm] = useState<Record<string, string>>({})
  const [savingMeasures, setSavingMeasures] = useState(false)

  async function loadProgress() {
    const [w, m] = await Promise.all([
      fetch("/api/user/progress/weight").then((r) => r.json()).catch(() => ({ entries: [] })),
      fetch("/api/user/progress/measurements").then((r) => r.json()).catch(() => ({ entries: [] })),
    ])
    setWeightEntries(w.entries ?? [])
    setMeasurements(m.entries ?? [])
  }

  const lastWeight = weightEntries[weightEntries.length - 1]
  const lastMeasurement = measurements[measurements.length - 1]

  async function postWeight(value: number) {
    if (!(value > 0 && value <= 500)) return
    await fetch("/api/user/progress/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr(), weightKg: value }),
    })
    await loadProgress()
  }

  async function saveWeightToday() {
    const value = Number(weightToday)
    if (!(value > 0 && value <= 500)) return
    setSavingWeight(true)
    await postWeight(value)
    setSavingWeight(false)
    setWeightToday("")
  }

  async function saveMeasurements() {
    const payload: Record<string, number> = {}
    for (const { key } of MEASUREMENT_FIELDS) {
      const raw = measureForm[key]
      if (!raw) continue
      const value = Number(raw)
      if (value > 0 && value <= 300) payload[key] = value
    }
    if (Object.keys(payload).length === 0) return
    setSavingMeasures(true)
    await fetch("/api/user/progress/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr(), ...payload }),
    })
    setSavingMeasures(false)
    setMeasureForm({})
    loadProgress()
  }

  useEffect(() => {
    const load = async () => {
      const localPrefs = typeof window !== "undefined" ? window.localStorage.getItem(V3_PREFERENCES_KEY) : null
      if (localPrefs) {
        setV3(parseV3Preferences(JSON.parse(localPrefs)))
      }
      const savedBrand = typeof window !== "undefined" ? window.localStorage.getItem(SUPPLEMENTS_KEY) : null
      if (savedBrand) setSupplementBrand(savedBrand)

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
        setUserEmail(u.user?.email || "")
        setPricingLabel(u.user?.pricing?.label || null)
      }

      setLoading(false)
    }

    load()
    loadProgress()
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      body: JSON.stringify({ force: true, supplementBrand }),
    })

    if (res.status === 402) {
      setShowPaywall(true)
      return
    }

    if (res.ok) {
      setPlanReady(true)
      window.location.href = "/Hoy"
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch (e) {
      console.error("Logout failed", e)
      setLoggingOut(false)
    }
  }

  const initials = (formData.nombre || userEmail || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"

  const onboardingSteps = [
    { title: "Biometría", done: !!(formData.edad && formData.altura && formData.peso) },
    { title: "Objetivo", done: !!(formData.pesoMeta && v3.primaryGoal) },
    { title: "Nutrición", done: !!(formData.tipoDieta && formData.supermercado) },
    { title: "Entrenamiento", done: formData.lugarEntrenamiento.length > 0 && formData.equipamiento.length > 0 },
    { title: "Suplementos", done: !!supplementBrand },
  ]

  const toggleSection = (key: SectionKey) => {
    setExpandedSection((prev) => (prev === key ? ("" as SectionKey) : key))
  }

  const sections: SectionDef[] = [
    { key: "biometria", icon: <User className="h-4 w-4" />, title: "Biometría", description: "Peso diario, medidas y evolución." },
    { key: "objetivo", icon: <Target className="h-4 w-4" />, title: "Objetivo", description: "Meta de peso, fecha y ritmo." },
    { key: "entrenamiento", icon: <Dumbbell className="h-4 w-4" />, title: "Perfil de entrenamiento", description: "Nivel, frecuencia, lugar y equipamiento." },
    { key: "nutricion", icon: <UtensilsCrossed className="h-4 w-4" />, title: "Nutrición", description: "Tipo de dieta, supermercado, alergias y preferencias." },
    { key: "salud", icon: <Watch className="h-4 w-4" />, title: "Salud", description: "Conecta tu reloj y revisa el estado de sincronización." },
    { key: "suplementos", icon: <Pill className="h-4 w-4" />, title: "Suplementos", description: "Marca seleccionada y protocolo diario." },
    { key: "planes", icon: <CheckCircle2 className="h-4 w-4" />, title: "Planes", description: "Plan activo, renovación y facturación." },
    { key: "resumen", icon: <Sparkles className="h-4 w-4" />, title: "Resumen v3", description: "Lo que usa SapoFit para personalizar tu plan." },
  ]

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 pb-10 md:p-6">
      {showPaywall && <PaywallDialog onClose={() => setShowPaywall(false)} />}

      {/* Tarjeta de usuario rápida */}
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-base font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{formData.nombre || "Tu perfil"}</p>
              <p className="truncate text-sm text-emerald-900/70">{userEmail || "—"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {planReady ? (
                  <Badge className="bg-emerald-600 text-white">{pricingLabel || "Plan activo"}</Badge>
                ) : (
                  <Badge variant="secondary">Sin plan activo</Badge>
                )}
                {saved && (
                  <Badge className="bg-emerald-500 text-white">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Guardado
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 rounded-2xl border-emerald-300 bg-white/70 text-emerald-900 hover:bg-white"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Salir
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {onboardingSteps.map((step) => (
            <div key={step.title} className="rounded-2xl bg-white/70 p-2.5">
              <p className="text-[11px] uppercase tracking-wide text-emerald-900/60">{step.title}</p>
              <p className={`mt-1 text-xs font-medium ${step.done ? "text-emerald-700" : "text-amber-700"}`}>
                {step.done ? "Completo" : "Pendiente"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/instalar"
          className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm transition-colors hover:bg-emerald-50"
        >
          <Smartphone className="h-5 w-5 text-emerald-600" />
          <span className="text-xs font-medium leading-tight">Descargar app Android</span>
        </Link>
        <a
          href="#salud"
          onClick={() => setExpandedSection("salud")}
          className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm transition-colors hover:bg-emerald-50"
        >
          <Watch className="h-5 w-5 text-emerald-600" />
          <span className="text-xs font-medium leading-tight">Conectar reloj</span>
        </a>
        <Link
          href="/objetivo"
          className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm transition-colors hover:bg-emerald-50"
        >
          <Target className="h-5 w-5 text-emerald-600" />
          <span className="text-xs font-medium leading-tight">Ir a Objetivo</span>
        </Link>
        <a
          href="#planes"
          onClick={() => setExpandedSection("planes")}
          className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm transition-colors hover:bg-emerald-50"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="text-xs font-medium leading-tight">Ver planes</span>
        </a>
      </section>

      {/* Acordeón de secciones */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = expandedSection === section.key
          return (
            <Card
              key={section.key}
              id={section.key}
              className={`rounded-2xl border bg-white shadow-sm transition-colors ${
                isOpen ? "border-l-4 border-l-emerald-500 border-y-emerald-100 border-r-emerald-100" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isOpen ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                    {section.icon}
                  </div>
                  <div>
                    <p className="font-medium">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <CardContent className="space-y-4 border-t pt-4">
                  {section.key === "biometria" && (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div><Label>Edad</Label><Input type="number" value={formData.edad} onChange={(e) => updateField("edad", e.target.value)} /></div>
                        <div><Label>Sexo</Label><Select value={formData.sexo} onValueChange={(v: "hombre" | "mujer") => updateField("sexo", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mujer">Mujer</SelectItem><SelectItem value="hombre">Hombre</SelectItem></SelectContent></Select></div>
                        <div><Label>Altura (cm)</Label><Input type="number" value={formData.altura} onChange={(e) => updateField("altura", e.target.value)} /></div>
                        <div><Label>Peso actual (kg)</Label><Input type="number" value={formData.peso} onChange={(e) => updateField("peso", e.target.value)} /></div>
                        <div><Label>Complexión</Label><Select value={formData.complexion} onValueChange={(v) => updateField("complexion", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="delgada">Delgada</SelectItem><SelectItem value="media">Media</SelectItem><SelectItem value="robusta">Robusta</SelectItem><SelectItem value="atletica">Atlética</SelectItem></SelectContent></Select></div>
                      </div>

                      <Card className="rounded-2xl border-slate-100 bg-emerald-50/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm"><Scale className="h-4 w-4" /> Peso diario</CardTitle>
                          <CardDescription>Registra tu peso de hoy para seguir tu evolución. Doble click sobre el último valor para editarlo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {lastWeight && (
                            <EditableCard
                              value={lastWeight.weight}
                              unit="kg"
                              min={1}
                              max={500}
                              onSave={(value) => postWeight(value)}
                              className="rounded-2xl bg-white p-3"
                            >
                              <p className="text-sm text-muted-foreground">Último registro</p>
                              <p className="text-2xl font-bold">
                                {lastWeight.weight} kg <span className="text-sm font-normal text-muted-foreground">({new Date(lastWeight.date).toLocaleDateString("es-ES")})</span>
                              </p>
                            </EditableCard>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Fecha</Label>
                              <Input value={new Date().toLocaleDateString("es-ES")} disabled />
                            </div>
                            <div>
                              <Label>Peso (kg)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={weightToday}
                                onChange={(e) => setWeightToday(e.target.value)}
                              />
                            </div>
                          </div>
                          <Button
                            className="w-full rounded-2xl"
                            disabled={savingWeight || !(Number(weightToday) > 0 && Number(weightToday) <= 500)}
                            onClick={saveWeightToday}
                          >
                            Guardar peso de hoy
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl border-slate-100 bg-emerald-50/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm"><Ruler className="h-4 w-4" /> Medidas</CardTitle>
                          <CardDescription>Actualiza tus medidas corporales periódicamente.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {MEASUREMENT_FIELDS.map(({ key, label }) => (
                              <div key={key}>
                                <Label>{label} (cm)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={measureForm[key] ?? ""}
                                  onChange={(e) => setMeasureForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                />
                              </div>
                            ))}
                          </div>
                          <Button className="w-full rounded-2xl" disabled={savingMeasures} onClick={saveMeasurements}>
                            Guardar medidas
                          </Button>
                          {lastMeasurement && (
                            <p className="text-sm text-muted-foreground">
                              Última actualización: {new Date(lastMeasurement.date).toLocaleDateString("es-ES")}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <UserWeightChart />
                      <WeightProgressChart />
                    </div>
                  )}

                  {section.key === "objetivo" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Objetivo principal</Label><Select value={v3.primaryGoal} onValueChange={(v) => updateV3("primaryGoal", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{objetivosPrincipales.map((goal) => <SelectItem key={goal} value={goal}>{goal}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Peso objetivo (kg)</Label><Input type="number" value={formData.pesoMeta} onChange={(e) => updateField("pesoMeta", e.target.value)} /></div>
                      <div><Label>Fecha objetivo</Label><Input type="date" value={formData.fechaMeta} onChange={(e) => updateField("fechaMeta", e.target.value)} /></div>
                      <div className="rounded-2xl border p-4 text-sm text-muted-foreground md:col-span-2">
                        Ritmo estimado: {formData.fechaMeta
                          ? `${Math.max(2, Math.ceil((new Date(formData.fechaMeta).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))} semanas hasta la fecha objetivo.`
                          : "Define una fecha objetivo para calcular el ritmo recomendado (por defecto 12 semanas)."}
                      </div>
                      <div className="md:col-span-2"><Link href="/objetivo" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline">Ver progreso completo del objetivo <ArrowRight className="h-3.5 w-3.5" /></Link></div>
                    </div>
                  )}

                  {section.key === "entrenamiento" && (
                    <div className="space-y-4">
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

                      <div><Label>Actividad diaria</Label><Select value={v3.activityLevel} onValueChange={(v) => updateV3("activityLevel", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activityLevels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                      <div className="rounded-2xl border p-4">
                        <div className="flex items-start gap-3"><Checkbox checked={v3.coupleMode} onCheckedChange={(checked) => updateV3("coupleMode", !!checked)} /><div><p className="font-medium">Modo pareja / dúo</p><p className="text-sm text-muted-foreground">Deja preparada la experiencia social de retos y seguimiento compartido.</p></div></div>
                      </div>
                    </div>
                  )}

                  {section.key === "nutricion" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Tipo de dieta</Label><Select value={formData.tipoDieta} onValueChange={(v) => updateField("tipoDieta", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tiposDieta.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Supermercado principal</Label><Select value={formData.supermercado} onValueChange={(v) => updateField("supermercado", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{supermercados.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Alergias o intolerancias</Label><Textarea rows={2} value={v3.allergies} onChange={(e) => updateV3("allergies", e.target.value)} placeholder="Ej: lactosa, marisco" /></div>
                      <div><Label>Ingredientes a excluir</Label><Textarea rows={2} value={v3.excludedIngredients} onChange={(e) => updateV3("excludedIngredients", e.target.value)} placeholder="Ej: cebolla, cilantro" /></div>
                      <div className="md:col-span-2"><Label>Alimentos a evitar del plan base</Label><Textarea rows={2} value={formData.alimentosNoPermitidos} onChange={(e) => updateField("alimentosNoPermitidos", e.target.value)} placeholder="Ej: frutos secos, picante" /></div>
                      <div><Label>Comensales</Label><Input type="number" min={1} value={String(v3.householdSize)} onChange={(e) => updateV3("householdSize", Math.max(1, Number(e.target.value) || 1))} /></div>
                      <div><Label>Hora comida principal</Label><Input type="time" value={formData.horaAlmorzar} onChange={(e) => updateField("horaAlmorzar", e.target.value)} /></div>
                      <div><Label>Hora de levantarse</Label><Input type="time" value={formData.horaLevantarse} onChange={(e) => updateField("horaLevantarse", e.target.value)} /></div>
                      <div><Label>Hora de acostarse</Label><Input type="time" value={formData.horaAcostarse} onChange={(e) => updateField("horaAcostarse", e.target.value)} /></div>
                      <div className="rounded-2xl border p-4">
                        <div className="flex items-start gap-3"><Checkbox checked={v3.hasAirfryer} onCheckedChange={(checked) => updateV3("hasAirfryer", !!checked)} /><div><p className="font-medium">Tengo Airfryer</p><p className="text-sm text-muted-foreground">El plan priorizará preparaciones rápidas y versiones alternativas.</p></div></div>
                      </div>
                      <div className="rounded-2xl border p-4">
                        <div className="flex items-start gap-3"><Checkbox checked={v3.needsTupperMeals} onCheckedChange={(checked) => updateV3("needsTupperMeals", !!checked)} /><div><p className="font-medium">Necesito comida para llevar</p><p className="text-sm text-muted-foreground">Se priorizan recetas aptas para batch cooking y recalentado.</p></div></div>
                      </div>
                    </div>
                  )}

                  {section.key === "salud" && (
                    <div className="space-y-4">
                      <ConnectWatchCard />
                    </div>
                  )}

                  {section.key === "suplementos" && (
                    <div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {SUPPLEMENT_BRANDS.map((brand) => {
                          const active = supplementBrand === brand.id
                          return (
                            <button
                              key={brand.id}
                              type="button"
                              onClick={() => {
                                const next = active ? "" : brand.id
                                setSupplementBrand(next)
                                if (typeof window !== "undefined") {
                                  if (next) window.localStorage.setItem(SUPPLEMENTS_KEY, next)
                                  else window.localStorage.removeItem(SUPPLEMENTS_KEY)
                                }
                              }}
                              className={`rounded-2xl border-2 p-3 text-left transition-all ${active ? "border-emerald-500 bg-emerald-50" : "border-transparent bg-muted/50 hover:bg-muted"}`}
                            >
                              <p className={`text-sm font-semibold ${active ? "text-emerald-700" : ""}`}>{brand.name}</p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">{brand.focus}</p>
                              {active && <Badge className="mt-2 bg-emerald-500 text-white text-[10px]">Seleccionado</Badge>}
                            </button>
                          )
                        })}
                      </div>
                      {!supplementBrand && (
                        <p className="mt-3 text-xs text-muted-foreground">Si no usas suplementos deja esto vacío.</p>
                      )}
                    </div>
                  )}

                  {section.key === "planes" && (
                    <div className="space-y-3">
                      <div className="rounded-2xl bg-emerald-50/60 p-4">
                        <p className="font-medium">Plan activo</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {planReady ? (pricingLabel ? `${pricingLabel} — plan en curso.` : "Tienes un plan generado y en curso.") : "Todavía no tienes un plan generado."}
                        </p>
                      </div>
                      <Button variant="outline" className="w-full rounded-2xl" onClick={generatePlan} disabled={saving}>
                        {planReady ? "Regenerar plan v3" : "Generar plan v3"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground">Gestión de facturación y cambios de plan: contacta con soporte desde el pie de página.</p>
                    </div>
                  )}

                  {section.key === "resumen" && (
                    <div className="space-y-3 text-sm">
                      <div className="rounded-2xl bg-emerald-50/60 p-4">
                        <p className="font-medium">Objetivo</p>
                        <p className="mt-1 text-muted-foreground">{v3.primaryGoal} con dieta {formData.tipoDieta.toLowerCase()} y {v3.householdSize} comensal(es).</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/60 p-4">
                        <p className="font-medium">Logística</p>
                        <p className="mt-1 text-muted-foreground">{v3.hasAirfryer ? "Con Airfryer" : "Sin Airfryer"} · {v3.needsTupperMeals ? "Comidas aptas para tupper" : "Comidas para casa"}.</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/60 p-4">
                        <p className="font-medium">Entrenamiento</p>
                        <p className="mt-1 text-muted-foreground">Nivel {v3.experienceLevel.toLowerCase()}, {v3.daysPerWeek} días por semana y sesiones de {v3.sessionDuration} minutos.</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/60 p-4">
                        <p className="font-medium">Social y hábitos</p>
                        <p className="mt-1 text-muted-foreground">Actividad {v3.activityLevel.toLowerCase()} {v3.coupleMode ? "con modo pareja activado" : "sin modo pareja"}.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Guardar / generar plan */}
      <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
        <CardContent className="space-y-3 p-5">
          <Button className="h-12 w-full rounded-2xl" onClick={saveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Guardar onboarding
          </Button>
          <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={generatePlan} disabled={saving}>
            Generar plan v3 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Footer legal */}
      <footer className="space-y-2 pt-4 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/privacidad" className="hover:underline">Privacidad</Link>
          <Link href="/terminos" className="hover:underline">Términos</Link>
          <Link href="/aviso-legal" className="hover:underline">Aviso legal</Link>
          <Link href="/cookies" className="hover:underline">Cookies</Link>
          <Link href="/soporte" className="hover:underline">Soporte</Link>
        </div>
        <p>SapoFit {APP_VERSION}</p>
      </footer>
    </div>
  )
}
