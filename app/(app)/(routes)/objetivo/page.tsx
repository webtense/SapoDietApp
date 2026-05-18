"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Edit3, Flame, Save, Scale, Target, TrendingDown, TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts"

// ─── tipos ────────────────────────────────────────────────────────────────────
interface Profile {
  weightKg: number | null
  heightCm: number | null
  age: number | null
  sex: string | null
  trainingFrequency: string | null
}
interface Goal {
  targetWeightKg: number | null
  targetWeeks: number | null
  targetDate: string | null
  viabilityStatus: string | null
}
interface WeightPoint { date: string; weightKg: number }

type ObjetivoTipo = "perder" | "ganar" | "mantener"

// ─── helpers de cálculo ───────────────────────────────────────────────────────
function calcBMI(weightKg: number, heightCm: number): number {
  return parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1))
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Bajo peso", color: "text-blue-600" }
  if (bmi < 25)   return { label: "Normopeso ✓", color: "text-emerald-600" }
  if (bmi < 30)   return { label: "Sobrepeso", color: "text-amber-600" }
  return { label: "Obesidad", color: "text-red-600" }
}

function idealWeightRange(heightCm: number, sex: string | null): [number, number] {
  const h = heightCm / 100
  const base = sex === "hombre" ? 50 + 2.3 * ((heightCm - 152.4) / 2.54)
    : 45.5 + 2.3 * ((heightCm - 152.4) / 2.54)
  const low = parseFloat((base * 0.95).toFixed(1))
  const high = parseFloat((base * 1.15).toFixed(1))
  return [Math.max(40, low), high]
}

function weeksToTarget(current: number, target: number, kgPerWeek: number): number {
  return Math.abs(Math.ceil((current - target) / kgPerWeek))
}

function viabilityLabel(wPerWeek: number, tipo: ObjetivoTipo): { ok: boolean; msg: string } {
  const limit = tipo === "ganar" ? 0.5 : 1.0
  if (wPerWeek > limit * 1.5)
    return { ok: false, msg: `Ritmo agresivo (${wPerWeek.toFixed(2)} kg/sem). Riesgo de pérdida muscular. Aumenta el plazo.` }
  if (wPerWeek <= limit)
    return { ok: true, msg: `Ritmo saludable (${wPerWeek.toFixed(2)} kg/sem). Factible y sostenible.` }
  return { ok: true, msg: `Ritmo moderado (${wPerWeek.toFixed(2)} kg/sem). Requiere disciplina.` }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

// ─── componente ───────────────────────────────────────────────────────────────
export default function ObjetivoPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [weights, setWeights] = useState<WeightPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // form local
  const [targetWeight, setTargetWeight] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [objetivoTipo, setObjetivoTipo] = useState<ObjetivoTipo>("perder")

  useEffect(() => {
    const load = async () => {
      const [profileRes, weightsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/tracking?type=weights&days=90"),
      ])
      if (profileRes.ok) {
        const d = await profileRes.json()
        setProfile(d.profile ?? null)
        if (d.goal) {
          setGoal(d.goal)
          setTargetWeight(d.goal.targetWeightKg ? String(d.goal.targetWeightKg) : "")
          setTargetDate(d.goal.targetDate ? d.goal.targetDate.split("T")[0] : "")
          const curr = d.profile?.weightKg ?? 0
          const tgt  = d.goal.targetWeightKg ?? 0
          setObjetivoTipo(curr > tgt ? "perder" : curr < tgt ? "ganar" : "mantener")
        }
      }
      if (weightsRes.ok) {
        const w = await weightsRes.json()
        if (Array.isArray(w.items)) {
          setWeights(
            w.items
              .filter((p: Record<string, unknown>) => typeof p.date === "string" && typeof p.weightKg === "number")
              .map((p: Record<string, unknown>) => ({ date: p.date as string, weightKg: p.weightKg as number }))
          )
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const guardar = async () => {
    if (!targetWeight || !targetDate) return
    setSaving(true)
    const pesoActual = profile?.weightKg ?? 0
    const pesoMeta = parseFloat(targetWeight)
    const diff = Math.abs(pesoActual - pesoMeta)
    const dias = daysUntil(targetDate)
    const semanas = Math.max(1, Math.round(dias / 7))
    const kgSem = parseFloat((diff / semanas).toFixed(3))
    const viable = kgSem <= (objetivoTipo === "ganar" ? 0.5 : 1.0) ? "viable" : "ambiciosa"

    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: profile?.age,
        height: profile?.heightCm,
        weight: profile?.weightKg,
        sex: profile?.sex,
        pesoMeta,
        tiempoMeta: semanas,
        targetDate,
        viabilityStatus: viable,
      }),
    })
    setGoal({ targetWeightKg: pesoMeta, targetWeeks: semanas, targetDate, viabilityStatus: viable })
    setSaving(false)
    setSaved(true)
    setEditMode(false)
    setTimeout(() => setSaved(false), 2000)
  }

  // métricas derivadas
  const currentWeight = weights.length ? weights[weights.length - 1].weightKg
    : profile?.weightKg ?? null
  const startWeight = weights.length ? weights[0].weightKg : profile?.weightKg ?? null
  const targetW = goal?.targetWeightKg ?? null

  const totalDiff = startWeight != null && targetW != null ? Math.abs(startWeight - targetW) : null
  const achieved  = startWeight != null && currentWeight != null && targetW != null
    ? Math.abs(startWeight - currentWeight) : null
  const progressPct = totalDiff && totalDiff > 0 && achieved != null
    ? Math.min(100, Math.round((achieved / totalDiff) * 100)) : 0

  const bmi = profile?.weightKg && profile?.heightCm
    ? calcBMI(profile.weightKg, profile.heightCm) : null
  const bmiInfo = bmi ? bmiCategory(bmi) : null
  const idealRange = profile?.heightCm ? idealWeightRange(profile.heightCm, profile.sex) : null

  const daysLeft = goal?.targetDate ? daysUntil(goal.targetDate) : null
  const weeksLeft = daysLeft != null ? Math.ceil(daysLeft / 7) : null
  const kgPending = currentWeight != null && targetW != null
    ? parseFloat(Math.abs(currentWeight - targetW).toFixed(1)) : null
  const kgPerWeek = kgPending != null && weeksLeft && weeksLeft > 0
    ? parseFloat((kgPending / weeksLeft).toFixed(2)) : null
  const viability = kgPerWeek != null ? viabilityLabel(kgPerWeek, objetivoTipo) : null

  const chartData = useMemo(() => {
    const points: { date: string; peso: number; meta: number | null; proyectado?: number }[] = weights.map((p) => ({
      date: formatDate(p.date),
      peso: p.weightKg,
      meta: targetW,
    }))
    // project target line if goal exists
    if (goal?.targetDate && targetW != null && weights.length) {
      const last = weights[weights.length - 1]
      const today = new Date(last.date)
      const end   = new Date(goal.targetDate)
      const daysTotal = Math.ceil((end.getTime() - new Date(weights[0].date).getTime()) / 86400000)
      if (daysTotal > 0) {
        const startW = weights[0].weightKg
        const slope = (targetW - startW) / daysTotal
        // add today projection point
        const daysSinceStart = Math.ceil((today.getTime() - new Date(weights[0].date).getTime()) / 86400000)
        const projected = parseFloat((startW + slope * daysSinceStart).toFixed(1))
        if (points.length > 0) points[points.length - 1].proyectado = projected
      }
    }
    return points
  }, [weights, targetW, goal])

  // hitos
  const hitos = useMemo(() => {
    if (!startWeight || !targetW || !currentWeight) return []
    const diff = startWeight - targetW
    const avance = startWeight - currentWeight
    return [
      { label: "5%",  threshold: startWeight - diff * 0.05 },
      { label: "25%", threshold: startWeight - diff * 0.25 },
      { label: "50%", threshold: startWeight - diff * 0.50 },
      { label: "75%", threshold: startWeight - diff * 0.75 },
      { label: "Meta ★", threshold: targetW },
    ].map((h) => ({
      ...h,
      reached: objetivoTipo === "perder" ? currentWeight <= h.threshold : currentWeight >= h.threshold,
      pct: Math.min(100, Math.round((Math.abs(diff - (h.threshold - targetW)) / Math.abs(diff)) * 100)),
    }))
  }, [startWeight, targetW, currentWeight, objetivoTipo])

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">

      {/* ── HERO ── */}
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,_rgba(4,47,31,0.94),_rgba(5,150,105,0.75))] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Target className="h-3 w-3" /> Objetivo
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {currentWeight ? `${currentWeight} kg` : "Sin datos"}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              {targetW
                ? `Meta: ${targetW} kg · ${kgPending != null ? `${kgPending} kg ${objetivoTipo === "perder" ? "por perder" : "por ganar"}` : ""}`
                : "Define tu meta de peso"}
            </p>
          </div>

          {/* Anillo de progreso */}
          <div className="rounded-[1.5rem] bg-white/12 p-4 backdrop-blur">
            <div className="flex items-center gap-4">
              {(() => {
                const r = 38; const circ = 2 * Math.PI * r
                const pct = progressPct / 100
                return (
                  <div className="relative flex-shrink-0">
                    <svg width="96" height="96" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
                      <circle cx="48" cy="48" r={r} fill="none"
                        stroke={progressPct >= 100 ? "#fbbf24" : "#34d399"} strokeWidth="7"
                        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                        strokeLinecap="round" transform="rotate(-90 48 48)"
                        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                      <text x="48" y="44" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">{progressPct}%</text>
                      <text x="48" y="58" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)">completado</text>
                    </svg>
                  </div>
                )
              })()}
              <div className="space-y-2 text-sm">
                <div><p className="text-white/60 text-xs">Inicio</p><p className="font-semibold">{startWeight ?? "--"} kg</p></div>
                <div><p className="text-white/60 text-xs">Meta</p><p className="font-semibold">{targetW ?? "--"} kg</p></div>
                <div><p className="text-white/60 text-xs">Días restantes</p><p className="font-semibold">{daysLeft ?? "--"}</p></div>
              </div>
            </div>
            {viability && (
              <div className={`mt-3 rounded-xl px-3 py-2 text-xs ${viability.ok ? "bg-emerald-500/20 text-emerald-100" : "bg-red-500/20 text-red-200"}`}>
                {viability.ok ? "✓" : "⚠"} {viability.msg}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS RÁPIDAS ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="rounded-[1.5rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1.5"><Scale className="h-3.5 w-3.5" /><span className="text-xs font-semibold">Peso actual</span></div>
            <p className="text-2xl font-bold">{currentWeight ?? "--"}</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1.5"><Target className="h-3.5 w-3.5" /><span className="text-xs font-semibold">IMC</span></div>
            <p className="text-2xl font-bold">{bmi ?? "--"}</p>
            <p className={`text-xs font-medium ${bmiInfo?.color ?? "text-muted-foreground"}`}>{bmiInfo?.label ?? "Sin datos"}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1.5">
              {objetivoTipo === "perder" ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
              <span className="text-xs font-semibold">Por {objetivoTipo}</span>
            </div>
            <p className="text-2xl font-bold">{kgPending ?? "--"}</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-white/70 bg-white/85 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1.5"><Flame className="h-3.5 w-3.5" /><span className="text-xs font-semibold">Ritmo</span></div>
            <p className="text-2xl font-bold">{kgPerWeek ?? "--"}</p>
            <p className="text-xs text-muted-foreground">kg / semana</p>
          </CardContent>
        </Card>
      </div>

      {/* ── GRÁFICO PESO ── */}
      {weights.length > 1 && (
        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Evolución del peso — 90 días</span>
              {goal?.targetDate && <Badge variant="secondary" className="text-xs">{daysLeft} días restantes</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis
                  domain={[
                    (d: number[]) => Math.floor(Math.min(...d) - 1),
                    (d: number[]) => Math.ceil(Math.max(...d) + 1),
                  ]}
                  tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: unknown, name: string) => {
                    const labels: Record<string, string> = { peso: "Peso", meta: "Meta", proyectado: "Proyectado" }
                    return [`${v} kg`, labels[name] ?? name]
                  }}
                />
                {targetW && <ReferenceLine y={targetW} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Meta ${targetW}`, position: "right", fontSize: 10, fill: "#10b981" }} />}
                <Line type="monotone" dataKey="peso" stroke="#059669" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="proyectado" stroke="#34d399" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── HITOS ── */}
      {hitos.length > 0 && (
        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hitos del camino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              {hitos.map((h, i) => (
                <div key={i} className="flex min-w-14 flex-col items-center gap-1.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    h.reached ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                  }`}>
                    {h.reached ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-bold">{h.label.split("%")[0]}{h.label.includes("%") ? "%" : ""}</span>}
                  </div>
                  <span className="text-center text-[10px] leading-tight text-muted-foreground">{h.label}</span>
                  <span className="text-[10px] font-semibold text-emerald-700">{h.threshold.toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DATOS CORPORALES ── */}
      {(bmi || idealRange) && (
        <div className="grid gap-4 md:grid-cols-2">
          {bmi && (
            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">IMC — Índice de Masa Corporal</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold">{bmi}</span>
                  <span className={`text-sm font-semibold ${bmiInfo?.color}`}>{bmiInfo?.label}</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-emerald-400 via-40% via-amber-400 via-70% to-red-400" />
                  <div
                    className="absolute top-0 h-full w-1 bg-gray-900"
                    style={{ left: `${Math.min(95, Math.max(5, ((bmi - 15) / 25) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>15 · Bajo</span><span>18.5</span><span>25</span><span>30</span><span>40+ · Obeso</span>
                </div>
              </CardContent>
            </Card>
          )}

          {idealRange && (
            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Peso ideal estimado</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">{idealRange[0]}</span>
                  <span className="text-xl text-muted-foreground">— {idealRange[1]} kg</span>
                </div>
                <p className="text-sm text-muted-foreground">Rango saludable según tu altura ({profile?.heightCm} cm) y sexo (fórmula Devine).</p>
                {targetW && (
                  <div className={`rounded-xl px-3 py-2 text-xs ${
                    targetW >= idealRange[0] && targetW <= idealRange[1]
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {targetW >= idealRange[0] && targetW <= idealRange[1]
                      ? `✓ Tu meta de ${targetW} kg está dentro del rango saludable.`
                      : `⚠ Tu meta de ${targetW} kg está ${targetW < idealRange[0] ? "por debajo del" : "por encima del"} rango ideal.`
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── CONFIGURAR META ── */}
      <Card className={`rounded-[1.75rem] shadow-sm transition-all ${editMode ? "border-emerald-300 bg-[linear-gradient(135deg,rgba(16,185,129,0.04),rgba(255,255,255,0.98))]" : "border-white/70 bg-white/85"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Configurar objetivo</span>
            <Button
              variant={editMode ? "outline" : "ghost"}
              size="sm"
              className="rounded-xl"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? <ChevronUp className="h-4 w-4" /> : <><Edit3 className="mr-1.5 h-4 w-4" />Editar</>}
            </Button>
          </CardTitle>
        </CardHeader>

        {editMode ? (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Tipo de objetivo</Label>
                <Select value={objetivoTipo} onValueChange={(v) => setObjetivoTipo(v as ObjetivoTipo)}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perder">Perder grasa</SelectItem>
                    <SelectItem value="ganar">Ganar masa muscular</SelectItem>
                    <SelectItem value="mantener">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Peso objetivo (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  className="mt-1.5 rounded-xl"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder={String(profile?.weightKg ?? 70)}
                />
              </div>
              <div>
                <Label>Fecha objetivo</Label>
                <Input
                  type="date"
                  className="mt-1.5 rounded-xl"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Preview viabilidad en tiempo real */}
            {targetWeight && targetDate && currentWeight != null && (() => {
              const diff = Math.abs(currentWeight - parseFloat(targetWeight))
              const dias = daysUntil(targetDate)
              const sem = Math.max(1, Math.ceil(dias / 7))
              const kgs = parseFloat((diff / sem).toFixed(2))
              const tipo = currentWeight > parseFloat(targetWeight) ? "perder" : "ganar"
              const v = viabilityLabel(kgs, tipo as ObjetivoTipo)
              return (
                <div className={`rounded-xl border px-4 py-3 text-sm ${v.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                  <span className="font-semibold">{v.ok ? "✓ Viable" : "⚠ Agresivo"}</span> · {sem} semanas · {kgs} kg/sem · {v.msg}
                </div>
              )
            })()}

            <div className="flex gap-2 pt-1">
              <Button className="rounded-xl" onClick={guardar} disabled={saving || !targetWeight || !targetDate}>
                {saving ? "Guardando…" : <><Save className="mr-1.5 h-4 w-4" />Guardar objetivo</>}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setEditMode(false)}>Cancelar</Button>
            </div>
            {saved && <Badge className="bg-emerald-500 text-white">Objetivo guardado ✓</Badge>}
          </CardContent>
        ) : (
          <CardContent>
            {goal?.targetWeightKg ? (
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Peso meta</p>
                  <p className="mt-1 text-xl font-bold">{goal.targetWeightKg} kg</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Fecha límite</p>
                  <p className="mt-1 font-semibold">
                    {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "–"}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Viabilidad</p>
                  <Badge className={`mt-1 ${goal.viabilityStatus === "viable" ? "bg-emerald-500" : "bg-amber-500"} text-white`}>
                    {goal.viabilityStatus === "viable" ? "Viable ✓" : "Ambiciosa ⚠"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/30 p-6 text-center">
                <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No tienes un objetivo de peso configurado.</p>
                <Button size="sm" className="mt-3 rounded-xl" onClick={() => setEditMode(true)}>
                  Configurar ahora
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── CONSEJOS SEGÚN OBJETIVO ── */}
      <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Claves para tu objetivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {objetivoTipo === "perder" && (<>
              <p>· <strong className="text-foreground">Déficit calórico de 300-500 kcal/día</strong> es el rango más efectivo y sostenible.</p>
              <p>· <strong className="text-foreground">Proteína alta (2 g/kg)</strong> preserva músculo durante el déficit.</p>
              <p>· <strong className="text-foreground">Pesar en ayunas</strong> cada 2-3 días y hacer media semanal. El peso diario oscila ±1,5 kg.</p>
              <p>· Espera al menos 4 semanas para evaluar si el ritmo es el correcto.</p>
            </>)}
            {objetivoTipo === "ganar" && (<>
              <p>· <strong className="text-foreground">Superávit controlado de 200-300 kcal</strong> minimiza la ganancia de grasa.</p>
              <p>· <strong className="text-foreground">Proteína 1,8-2 g/kg</strong> y entrenamiento progresivo son imprescindibles.</p>
              <p>· Ritmo realista: 0,2-0,5 kg/sem de peso total (la mayoría músculo+agua).</p>
              <p>· Si subes más de 0,5 kg/sem, reduce 100-150 kcal del superávit.</p>
            </>)}
            {objetivoTipo === "mantener" && (<>
              <p>· <strong className="text-foreground">Calorías de mantenimiento</strong> = peso × 30-35 kcal (actividad moderada).</p>
              <p>· Oscilaciones de ±1 kg son normales. Interviene solo si llevas 2 semanas fuera de rango.</p>
              <p>· Mantén el hábito de pesar semanalmente para detección temprana de deriva.</p>
            </>)}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
