"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Eye,
  ShoppingCart,
  Users,
  Star,
  Mail,
  Instagram,
  TrendingUp,
  Wallet,
  Target,
  AlertCircle,
} from "lucide-react"

interface DashboardMetrics {
  period: { days: number; since: string }
  visits: {
    configured: boolean
    totalSessions: number
    totalActiveUsers: number
    totalPageViews: number
    daily: { date: string; sessions: number; activeUsers: number; pageViews: number }[]
    error?: string
  }
  purchases: {
    configured: boolean
    totalRevenue: number
    totalPurchases: number
    currency: string
    daily: { date: string; amount: number; count: number }[]
    error?: string
  }
  kpis: {
    cac: number | null
    ltv: number | null
    conversionRate: number | null
    conversionBasis: string
    arpu: number | null
    avgLifetimeMonths: number | null
    monthlyAdSpend: number
  }
  testers: { total: number; newInPeriod: number; active: number; pro: number }
  reviews: {
    count: number
    avgRating: number | null
    recent: { id: string; name: string; rating: number; comment: string | null; source: string; createdAt: string }[]
  }
  emailSubscribers: { configured: boolean; provider: string | null; totalSubscribers: number; error?: string }
  instagram: {
    configured: boolean
    totalPosts: number
    totalLikes: number
    totalComments: number
    avgEngagement: number
    posts: { id: string; caption: string | null; permalink: string | null; likes: number; comments: number; postedAt: string; source: string }[]
    error?: string
  }
}

const PERIODS = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
]

function formatEUR(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value)
}

function formatPct(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—"
  return `${value.toFixed(1)}%`
}

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("es-ES").format(Math.round(value))
}

function ConfiguraAviso({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      {text}
    </p>
  )
}

export default function AdminMetricsDashboard() {
  const [days, setDays] = useState(30)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [adSpendDraft, setAdSpendDraft] = useState("")
  const [reviewForm, setReviewForm] = useState({ name: "", rating: "5", comment: "" })
  const [igForm, setIgForm] = useState({ caption: "", permalink: "", imageUrl: "", likes: "", comments: "", postedAt: "" })
  const [savingReview, setSavingReview] = useState(false)
  const [savingIg, setSavingIg] = useState(false)
  const [savingAdSpend, setSavingAdSpend] = useState(false)

  const load = async (periodDays: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/metrics?days=${periodDays}`)
      if (!res.ok) throw new Error("No se pudo cargar el dashboard de métricas")
      const data = await res.json()
      setMetrics(data.metrics)
      setAdSpendDraft(String(data.metrics.kpis.monthlyAdSpend ?? 0))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(days)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const visitsChartData = useMemo(
    () => (metrics?.visits.daily || []).map((d) => ({ date: d.date.slice(5), sesiones: d.sessions })),
    [metrics],
  )
  const revenueChartData = useMemo(
    () => (metrics?.purchases.daily || []).map((d) => ({ date: d.date.slice(5), ingresos: d.amount })),
    [metrics],
  )

  const saveReview = async () => {
    if (!reviewForm.name.trim()) {
      setError("El nombre de la reseña es obligatorio")
      return
    }
    setSavingReview(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/metrics/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: reviewForm.name, rating: Number(reviewForm.rating), comment: reviewForm.comment }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar la reseña")
      setMessage("Reseña añadida")
      setReviewForm({ name: "", rating: "5", comment: "" })
      await load(days)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setSavingReview(false)
    }
  }

  const saveInstagramPost = async () => {
    if (!igForm.postedAt) {
      setError("La fecha de publicación es obligatoria")
      return
    }
    setSavingIg(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/metrics/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: igForm.caption,
          permalink: igForm.permalink,
          imageUrl: igForm.imageUrl,
          likes: Number(igForm.likes) || 0,
          comments: Number(igForm.comments) || 0,
          postedAt: igForm.postedAt,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar el post")
      setMessage("Post de Instagram añadido")
      setIgForm({ caption: "", permalink: "", imageUrl: "", likes: "", comments: "", postedAt: "" })
      await load(days)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setSavingIg(false)
    }
  }

  const saveAdSpend = async () => {
    setSavingAdSpend(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/metrics/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyAdSpend: Number(adSpendDraft) || 0 }),
      })
      if (!res.ok) throw new Error("No se pudo guardar la inversión en ads")
      setMessage("Inversión en ads actualizada")
      await load(days)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setSavingAdSpend(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6 px-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">Dashboard de métricas</h1>
          <p className="text-sm text-muted-foreground">Visitas, compras, testers, reseñas, email e Instagram</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="rounded-full border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            ← Usuarios
          </Link>
          {PERIODS.map((p) => (
            <Button key={p.days} variant={days === p.days ? "default" : "outline"} size="sm" onClick={() => setDays(p.days)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      {message && <p className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">{message}</p>}

      {loading || !metrics ? (
        <p className="text-sm text-muted-foreground">Cargando métricas...</p>
      ) : (
        <>
          {/* Tarjetas principales */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Eye className="h-4 w-4" /> Visitas web</div>
                <p className="text-2xl font-bold mt-1">{formatNumber(metrics.visits.totalSessions)}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(metrics.visits.totalActiveUsers)} usuarios activos</p>
                {!metrics.visits.configured && <ConfiguraAviso text="Configura GA4_PROPERTY_ID, GA4_CLIENT_EMAIL y GA4_PRIVATE_KEY" />}
                {metrics.visits.error && <ConfiguraAviso text={metrics.visits.error} />}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><ShoppingCart className="h-4 w-4" /> Compras directas</div>
                <p className="text-2xl font-bold mt-1">{formatEUR(metrics.purchases.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(metrics.purchases.totalPurchases)} compras (Stripe)</p>
                {metrics.purchases.error && <ConfiguraAviso text={metrics.purchases.error} />}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="h-4 w-4" /> Testers inscritos</div>
                <p className="text-2xl font-bold mt-1">{formatNumber(metrics.testers.total)}</p>
                <p className="text-xs text-muted-foreground">
                  +{formatNumber(metrics.testers.newInPeriod)} en el periodo · {formatNumber(metrics.testers.pro)} PRO
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Star className="h-4 w-4" /> Reseñas</div>
                <p className="text-2xl font-bold mt-1">
                  {metrics.reviews.avgRating ? metrics.reviews.avgRating.toFixed(1) : "—"} <span className="text-sm font-normal text-muted-foreground">/5</span>
                </p>
                <p className="text-xs text-muted-foreground">{formatNumber(metrics.reviews.count)} reseñas</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Mail className="h-4 w-4" /> Email suscriptores</div>
                <p className="text-2xl font-bold mt-1">{formatNumber(metrics.emailSubscribers.totalSubscribers)}</p>
                <p className="text-xs text-muted-foreground">{metrics.emailSubscribers.provider || "sin proveedor"}</p>
                {!metrics.emailSubscribers.configured && <ConfiguraAviso text="Configura BREVO_API_KEY o mailjet_apikey/mailjet_clave_secreta" />}
                {metrics.emailSubscribers.error && <ConfiguraAviso text={metrics.emailSubscribers.error} />}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Instagram className="h-4 w-4" /> Instagram</div>
                <p className="text-2xl font-bold mt-1">{formatNumber(metrics.instagram.totalPosts)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics.instagram.totalLikes)} likes · {formatNumber(metrics.instagram.totalComments)} comentarios
                </p>
                {!metrics.instagram.configured && <ConfiguraAviso text="Configura INSTAGRAM_ACCESS_TOKEN y INSTAGRAM_BUSINESS_ACCOUNT_ID, o añade posts a mano" />}
                {metrics.instagram.error && <ConfiguraAviso text={metrics.instagram.error} />}
              </CardContent>
            </Card>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Target className="h-4 w-4" /> CAC</div>
                <p className="text-2xl font-bold mt-1">{formatEUR(metrics.kpis.cac)}</p>
                <p className="text-xs text-muted-foreground">
                  Inversión ads / testers nuevos ({formatEUR(metrics.kpis.monthlyAdSpend)} / {formatNumber(metrics.testers.newInPeriod)})
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Wallet className="h-4 w-4" /> LTV (estimado)</div>
                <p className="text-2xl font-bold mt-1">{formatEUR(metrics.kpis.ltv)}</p>
                <p className="text-xs text-muted-foreground">
                  ARPU {formatEUR(metrics.kpis.arpu)} × {metrics.kpis.avgLifetimeMonths ? metrics.kpis.avgLifetimeMonths.toFixed(1) : "—"} meses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="h-4 w-4" /> Conversión</div>
                <p className="text-2xl font-bold mt-1">{formatPct(metrics.kpis.conversionRate)}</p>
                <p className="text-xs text-muted-foreground">Base: {metrics.kpis.conversionBasis}</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Visitas web</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {visitsChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin datos de GA4 en este periodo.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={visitsChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 12 }} width={36} />
                        <Tooltip />
                        <Line type="monotone" dataKey="sesiones" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Ingresos (Stripe)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {revenueChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin compras en este periodo.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 12 }} width={36} />
                        <Tooltip formatter={(value: number) => formatEUR(value)} />
                        <Bar dataKey="ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ajuste de inversión en ads (para el CAC) */}
          <Card>
            <CardHeader><CardTitle className="text-base">Inversión mensual en ads (para CAC)</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div>
                <Label className="text-xs">Importe mensual (€)</Label>
                <Input value={adSpendDraft} onChange={(e) => setAdSpendDraft(e.target.value)} className="w-40" />
              </div>
              <Button variant="outline" size="sm" onClick={saveAdSpend} disabled={savingAdSpend}>
                {savingAdSpend ? "Guardando..." : "Guardar"}
              </Button>
            </CardContent>
          </Card>

          {/* Reseñas: lista + alta manual */}
          <Card>
            <CardHeader><CardTitle className="text-base">Reseñas recientes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="md:col-span-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input value={reviewForm.name} onChange={(e) => setReviewForm((c) => ({ ...c, name: e.target.value }))} />
                </div>
                <div className="md:col-span-1">
                  <Label className="text-xs">Valoración (1-5)</Label>
                  <Input value={reviewForm.rating} onChange={(e) => setReviewForm((c) => ({ ...c, rating: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Comentario</Label>
                  <Textarea value={reviewForm.comment} onChange={(e) => setReviewForm((c) => ({ ...c, comment: e.target.value }))} rows={1} />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={saveReview} disabled={savingReview}>
                {savingReview ? "Guardando..." : "Añadir reseña"}
              </Button>

              <div className="space-y-2">
                {metrics.reviews.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todavía no hay reseñas registradas.</p>
                ) : (
                  metrics.reviews.recent.map((r) => (
                    <div key={r.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.name}</span>
                        <Badge variant="secondary">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</Badge>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instagram: lista + alta manual */}
          <Card>
            <CardHeader><CardTitle className="text-base">Instagram — posts recientes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-6">
                <div className="md:col-span-2">
                  <Label className="text-xs">Enlace del post</Label>
                  <Input value={igForm.permalink} onChange={(e) => setIgForm((c) => ({ ...c, permalink: e.target.value }))} />
                </div>
                <div className="md:col-span-1">
                  <Label className="text-xs">Likes</Label>
                  <Input value={igForm.likes} onChange={(e) => setIgForm((c) => ({ ...c, likes: e.target.value }))} />
                </div>
                <div className="md:col-span-1">
                  <Label className="text-xs">Comentarios</Label>
                  <Input value={igForm.comments} onChange={(e) => setIgForm((c) => ({ ...c, comments: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Fecha de publicación</Label>
                  <Input type="date" value={igForm.postedAt} onChange={(e) => setIgForm((c) => ({ ...c, postedAt: e.target.value }))} />
                </div>
                <div className="md:col-span-6">
                  <Label className="text-xs">Descripción</Label>
                  <Textarea value={igForm.caption} onChange={(e) => setIgForm((c) => ({ ...c, caption: e.target.value }))} rows={1} />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={saveInstagramPost} disabled={savingIg}>
                {savingIg ? "Guardando..." : "Añadir post"}
              </Button>

              <div className="space-y-2">
                {metrics.instagram.posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todavía no hay posts registrados.</p>
                ) : (
                  metrics.instagram.posts.map((p) => (
                    <div key={p.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{p.caption || p.permalink || "Post sin descripción"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.postedAt).toLocaleDateString()} · {p.source === "API" ? "Sincronizado" : "Manual"}</p>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground shrink-0">
                        <span>❤️ {p.likes}</span>
                        <span>💬 {p.comments}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
