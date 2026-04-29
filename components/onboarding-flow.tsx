"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  ArrowRight, ArrowLeft, User, Target, Utensils,
  Dumbbell, Sparkles, CheckCircle2, Loader2, Scale, Clock
} from "lucide-react"
import { defaultV3Preferences, V3_PREFERENCES_KEY } from "@/lib/v3-preferences"

const DRAFT_KEY = "sapofit_onboarding_draft"

interface OnboardingData {
  nombre: string
  edad: string
  altura: string
  peso: string
  sexo: "hombre" | "mujer"
  complexion: string
  objetivo: string
  pesoMeta: string
  fechaMeta: string
  tipoDieta: string
  alimentosEvitados: string
  horaLevantarse: string
  horaAcostarse: string
  horaAlmorzar: string
  supermercado: string
  frecuenciaEntrenamiento: string
  lugares: string[]
  equipamiento: string[]
}

const defaults: OnboardingData = {
  nombre: "",
  edad: "",
  altura: "",
  peso: "",
  sexo: "mujer",
  complexion: "media",
  objetivo: "",
  pesoMeta: "",
  fechaMeta: "",
  tipoDieta: "Mediterránea",
  alimentosEvitados: "",
  horaLevantarse: "07:00",
  horaAcostarse: "23:00",
  horaAlmorzar: "14:00",
  supermercado: "Mercadona",
  frecuenciaEntrenamiento: "3-4",
  lugares: ["casa"],
  equipamiento: ["Sin material"],
}

const TOTAL_STEPS = 4

export function OnboardingFlow({ userName }: { userName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)          // 0 = bienvenida, 1-4 = pasos, 5 = generando
  const [data, setData] = useState<OnboardingData>({ ...defaults, nombre: userName })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Cargar borrador guardado
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) setData({ ...defaults, nombre: userName, ...JSON.parse(draft) })
    } catch {}
  }, [userName])

  // Guardar borrador al cambiar datos
  useEffect(() => {
    if (step > 0) localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  }, [data, step])

  const set = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) =>
    setData(prev => ({ ...prev, [field]: value }))

  const toggleList = (field: "lugares" | "equipamiento", value: string) =>
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))

  const canNext = (): boolean => {
    if (step === 1) return !!(data.edad && data.altura && data.peso && data.nombre)
    if (step === 2) return !!(data.objetivo && data.pesoMeta)
    if (step === 3) return !!(data.tipoDieta && data.supermercado)
    if (step === 4) return data.lugares.length > 0 && data.equipamiento.length > 0
    return true
  }

  const handleFinish = async () => {
    setSaving(true)
    setError("")
    setStep(5)

    const semanas = data.fechaMeta
      ? Math.max(2, Math.ceil((new Date(data.fechaMeta).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
      : 12

    const payload = {
      name: data.nombre,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      age: Number(data.edad),
      height: Number(data.altura),
      weight: Number(data.peso),
      sex: data.sexo,
      complexion: data.complexion,
      pesoMeta: data.pesoMeta ? Number(data.pesoMeta) : undefined,
      tiempoMeta: semanas,
      targetDate: data.fechaMeta || undefined,
      tipoDieta: data.tipoDieta,
      alimentosNoPermitidos: data.alimentosEvitados,
      horaLevantarse: data.horaLevantarse,
      horaAcostarse: data.horaAcostarse,
      horaAlmorzar: data.horaAlmorzar,
      supermercado: data.supermercado,
      frecuenciaEntrenamiento: data.frecuenciaEntrenamiento,
      lugarEntrenamiento: data.lugares,
      equipamiento: data.equipamiento,
    }

    try {
      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!profileRes.ok) throw new Error("Error guardando perfil")

      const v3 = { ...defaultV3Preferences, primaryGoal: data.objetivo }
      localStorage.setItem(V3_PREFERENCES_KEY, JSON.stringify(v3))

      await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      })

      localStorage.removeItem(DRAFT_KEY)
      router.push("/Hoy")
    } catch (e) {
      setError("Hubo un error. Inténtalo de nuevo.")
      setSaving(false)
      setStep(4)
    }
  }

  // ── Estilos compartidos ──────────────────────────────────────
  const chip = (active: boolean) =>
    cn(
      "cursor-pointer rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all select-none",
      active
        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
        : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
    )

  const bigBtn = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-5 text-sm font-semibold transition-all cursor-pointer select-none",
      active
        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
        : "border-gray-200 bg-white text-gray-500 hover:border-emerald-300"
    )

  // ── Pantalla de generación ────────────────────────────────────
  if (step === 5) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <Sparkles className="h-10 w-10 text-emerald-600 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Creando tu plan personalizado</h2>
          <p className="mt-2 text-gray-500">Esto solo tarda unos segundos…</p>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  // ── Pantalla de bienvenida (step 0) ──────────────────────────
  if (step === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 p-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#50c878,_#2d8a5e)] shadow-lg">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
        <div className="max-w-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            {data.nombre ? `¡Hola, ${data.nombre.split(" ")[0]}!` : "¡Bienvenido/a!"}
          </h1>
          <p className="mt-3 text-base text-gray-500 leading-relaxed">
            Vamos a configurar tu perfil en <strong className="text-emerald-600">4 pasos rápidos</strong> para
            crear un plan de nutrición y entrenamiento hecho a tu medida.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {[
            { icon: User,     label: "Tu cuerpo" },
            { icon: Target,   label: "Tu objetivo" },
            { icon: Utensils, label: "Tu alimentación" },
            { icon: Dumbbell, label: "Tu entrenamiento" },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                {i + 1}
              </div>
              <Icon className="h-4 w-4 text-emerald-500" />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <Button
          size="lg"
          className="mt-2 w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-semibold"
          onClick={() => setStep(1)}
        >
          Empezar <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    )
  }

  // ── Header con progreso (steps 1-4) ──────────────────────────
  const stepIcons = [User, Target, Utensils, Dumbbell]
  const stepLabels = ["Tu cuerpo", "Objetivo", "Alimentación", "Entrenamiento"]

  const StepHeader = () => (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Paso {step} de {TOTAL_STEPS}</span>
        <span>{Math.round((step / TOTAL_STEPS) * 100)}% completado</span>
      </div>
      <Progress value={(step / TOTAL_STEPS) * 100} className="h-2 bg-gray-100 [&>div]:bg-emerald-500" />
      <div className="flex justify-between">
        {stepLabels.map((label, i) => {
          const Icon = stepIcons[i]
          const idx = i + 1
          return (
            <div key={i} className={cn("flex flex-col items-center gap-1", idx > step ? "opacity-30" : "")}>
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                idx < step ? "bg-emerald-500 text-white" :
                idx === step ? "bg-emerald-600 text-white ring-4 ring-emerald-100" :
                "bg-gray-100 text-gray-400"
              )}>
                {idx < step ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className="hidden text-[10px] font-medium text-gray-500 sm:block">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const NavButtons = ({ onNext, nextLabel = "Siguiente" }: { onNext: () => void; nextLabel?: string }) => (
    <div className="mt-8 flex gap-3">
      {step > 1 && (
        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(s => s - 1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
        </Button>
      )}
      <Button
        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        disabled={!canNext()}
        onClick={onNext}
      >
        {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )

  // ── Step 1: Tu cuerpo ────────────────────────────────────────
  if (step === 1) return (
    <div className="mx-auto max-w-md p-4 md:p-6">
      <StepHeader />
      <h2 className="mb-1 text-xl font-bold text-gray-900">Tu cuerpo</h2>
      <p className="mb-5 text-sm text-gray-500">Estos datos son la base para calcular tus calorías y macros.</p>

      <div className="space-y-4">
        <div>
          <Label className="mb-1 block text-sm font-medium">Tu nombre</Label>
          <Input
            placeholder="Nombre completo"
            value={data.nombre}
            onChange={e => set("nombre", e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium">Sexo</Label>
          <div className="flex gap-3">
            {(["mujer", "hombre"] as const).map(s => (
              <button key={s} className={bigBtn(data.sexo === s)} onClick={() => set("sexo", s)}>
                <span className="text-2xl">{s === "mujer" ? "👩" : "👨"}</span>
                <span className="capitalize">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="mb-1 block text-sm font-medium">Edad</Label>
            <Input type="number" placeholder="30" min="16" max="99"
              value={data.edad} onChange={e => set("edad", e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label className="mb-1 block text-sm font-medium">Altura (cm)</Label>
            <Input type="number" placeholder="165" min="140" max="220"
              value={data.altura} onChange={e => set("altura", e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label className="mb-1 block text-sm font-medium">Peso (kg)</Label>
            <Input type="number" placeholder="70" min="40" max="200" step="0.1"
              value={data.peso} onChange={e => set("peso", e.target.value)} className="rounded-xl" />
          </div>
        </div>

        <div>
          <Label className="mb-1 block text-sm font-medium">Complexión</Label>
          <Select value={data.complexion} onValueChange={v => set("complexion", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["delgada", "media", "fuerte"].map(v => (
                <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <NavButtons onNext={() => setStep(2)} />
    </div>
  )

  // ── Step 2: Objetivo ─────────────────────────────────────────
  if (step === 2) return (
    <div className="mx-auto max-w-md p-4 md:p-6">
      <StepHeader />
      <h2 className="mb-1 text-xl font-bold text-gray-900">Tu objetivo</h2>
      <p className="mb-5 text-sm text-gray-500">¿Qué quieres conseguir? Sé específico para un plan más eficaz.</p>

      <div className="space-y-5">
        <div>
          <Label className="mb-2 block text-sm font-medium">Objetivo principal</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "Perder grasa",         emoji: "🔥", desc: "Reducir % grasa" },
              { value: "Ganar masa muscular",  emoji: "💪", desc: "Aumentar músculo" },
              { value: "Mantenimiento",        emoji: "⚖️", desc: "Mantener el peso" },
              { value: "Mejorar condición física", emoji: "🏃", desc: "Más energía y forma" },
            ].map(({ value, emoji, desc }) => (
              <button
                key={value}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer",
                  data.objetivo === value
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                )}
                onClick={() => set("objetivo", value)}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-sm font-semibold text-gray-800">{value}</span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-sm font-medium">
              <Scale className="mr-1 inline h-3.5 w-3.5" />
              Peso meta (kg)
            </Label>
            <Input type="number" placeholder="65" min="40" max="200" step="0.1"
              value={data.pesoMeta} onChange={e => set("pesoMeta", e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label className="mb-1 block text-sm font-medium">Fecha objetivo</Label>
            <Input type="date" value={data.fechaMeta}
              min={new Date(Date.now() + 14 * 864e5).toISOString().split("T")[0]}
              onChange={e => set("fechaMeta", e.target.value)} className="rounded-xl" />
          </div>
        </div>
      </div>

      <NavButtons onNext={() => setStep(3)} />
    </div>
  )

  // ── Step 3: Alimentación ─────────────────────────────────────
  if (step === 3) return (
    <div className="mx-auto max-w-md p-4 md:p-6">
      <StepHeader />
      <h2 className="mb-1 text-xl font-bold text-gray-900">Tu alimentación</h2>
      <p className="mb-5 text-sm text-gray-500">Personaliza tu dieta y horarios para adaptarlos a tu rutina.</p>

      <div className="space-y-5">
        <div>
          <Label className="mb-2 block text-sm font-medium">Tipo de dieta</Label>
          <div className="flex flex-wrap gap-2">
            {["Mediterránea", "Vegetariana", "Vegana", "Keto", "Alta en proteínas", "Baja en carbohidratos"].map(d => (
              <button key={d} className={chip(data.tipoDieta === d)} onClick={() => set("tipoDieta", d)}>{d}</button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-1 block text-sm font-medium">Supermercado habitual</Label>
          <Select value={data.supermercado} onValueChange={v => set("supermercado", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Mercadona", "Carrefour", "Lidl", "Aldi", "Dia", "Eroski", "Alcampo"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1 block text-sm font-medium">Alimentos que evitas o alergias</Label>
          <Textarea
            placeholder="Ej: gluten, lactosa, marisco…"
            rows={2}
            value={data.alimentosEvitados}
            onChange={e => set("alimentosEvitados", e.target.value)}
            className="resize-none rounded-xl text-sm"
          />
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium">
            <Clock className="mr-1 inline h-3.5 w-3.5" />
            Horarios
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { field: "horaLevantarse", label: "Me levanto" },
              { field: "horaAlmorzar",   label: "Almuerzo" },
              { field: "horaAcostarse",  label: "Me acuesto" },
            ] as const).map(({ field, label }) => (
              <div key={field}>
                <Label className="mb-1 block text-[11px] text-gray-400">{label}</Label>
                <Input type="time" value={data[field]}
                  onChange={e => set(field, e.target.value)} className="rounded-xl text-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <NavButtons onNext={() => setStep(4)} />
    </div>
  )

  // ── Step 4: Entrenamiento ────────────────────────────────────
  if (step === 4) return (
    <div className="mx-auto max-w-md p-4 md:p-6">
      <StepHeader />
      <h2 className="mb-1 text-xl font-bold text-gray-900">Tu entrenamiento</h2>
      <p className="mb-5 text-sm text-gray-500">¿Dónde y con qué frecuencia entrenas?</p>

      <div className="space-y-5">
        <div>
          <Label className="mb-2 block text-sm font-medium">Frecuencia semanal</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "1-2", label: "1-2 días" },
              { value: "3-4", label: "3-4 días" },
              { value: "5-6", label: "5-6 días" },
              { value: "7",   label: "Todos los días" },
            ].map(({ value, label }) => (
              <button key={value} className={chip(data.frecuenciaEntrenamiento === value)}
                onClick={() => set("frecuenciaEntrenamiento", value)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium">¿Dónde entrenas?</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "casa",        label: "🏠 En casa" },
              { value: "gimnasio",    label: "🏋️ Gimnasio" },
              { value: "aire libre",  label: "🌳 Al aire libre" },
            ].map(({ value, label }) => (
              <button key={value} className={chip(data.lugares.includes(value))}
                onClick={() => toggleList("lugares", value)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium">Material disponible</Label>
          <div className="flex flex-wrap gap-2">
            {["Sin material", "Bandas", "Mancuernas", "Barra", "Máquinas"].map(v => (
              <button key={v} className={chip(data.equipamiento.includes(v))}
                onClick={() => toggleList("equipamiento", v)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100">
          <p className="font-semibold mb-1">🎉 ¡Ya casi está!</p>
          <p className="text-emerald-600 text-xs">
            Con toda esta información vamos a generar tu plan de nutrición y entrenamiento personalizado.
          </p>
        </div>
      </div>

      <NavButtons
        onNext={handleFinish}
        nextLabel={saving ? "Generando..." : "Generar mi plan"}
      />
    </div>
  )

  return null
}
