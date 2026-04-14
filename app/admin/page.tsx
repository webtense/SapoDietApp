"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DEFAULT_MODULE_KEYS, type ModuleKey } from "@/lib/constants/modules"
import { TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle, Scale, Calendar, Dumbbell, Utensils } from "lucide-react"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  pendingInvitations: number
  loginsToday: number
}

interface UserModuleState {
  moduleKey: ModuleKey
  enabled: boolean
}

interface InvitationSummary {
  id: string
  status: string
  expiresAt: string
  createdAt: string
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  status: string
  role: string
  createdAt: string
  lastLoginAt: string | null
  loginCount: number
  profileCompletion: number
  hasProfile: boolean
  hasGoal: boolean
  hasMealPlan: boolean
  recentWeight: number | null
  weightChange: number | null
  mealsCompleted: number
  workoutsCompleted: number
  daysActive: number
  modules: UserModuleState[]
  pricing: { label: string; monthlyPrice: number | null } | null
  latestInvitation: InvitationSummary | null
}

interface AdminInvitation {
  id: string
  email: string
  name: string | null
  status: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
  invitedUser: { id: string; email: string; name: string | null; status: string } | null
}

interface LoginEvent {
  id: string
  createdAt: string
  ip: string | null
  userAgent: string | null
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleString()
}

function formatDateShort(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString()
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [priceDrafts, setPriceDrafts] = useState<Record<string, { label: string; monthlyPrice: string }>>({})
  const [moduleDrafts, setModuleDrafts] = useState<Record<string, UserModuleState[]>>({})
  const [activity, setActivity] = useState<Record<string, LoginEvent[]>>({})
  const [activityLoading, setActivityLoading] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({ email: "", name: "", priceLabel: "", monthlyPrice: "", sendInvitation: true })
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const syncDrafts = (userList: AdminUser[]) => {
    setPriceDrafts(
      Object.fromEntries(
        userList.map((user) => [
          user.id,
          {
            label: user.pricing?.label || "",
            monthlyPrice: user.pricing?.monthlyPrice != null ? String(user.pricing.monthlyPrice) : "",
          },
        ]),
      ),
    )
    setModuleDrafts(
      Object.fromEntries(
        userList.map((user) => {
          const existing = new Map(user.modules.map((module) => [module.moduleKey, module.enabled]))
          return [
            user.id,
            DEFAULT_MODULE_KEYS.map((moduleKey) => ({ moduleKey, enabled: existing.get(moduleKey) ?? false })),
          ]
        }),
      ),
    )
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes, invitationsRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/users"),
        fetch("/api/admin/invitations"),
      ])
      if (!statsRes.ok) throw new Error("No se pudo cargar el dashboard")
      if (!usersRes.ok) throw new Error("No se pudo cargar la lista de usuarios")
      if (!invitationsRes.ok) throw new Error("No se pudo cargar las invitaciones")

      const statsJson = await statsRes.json()
      const usersJson = await usersRes.json()
      const invitationsJson = await invitationsRes.json()

      setStats(statsJson.stats)
      setUsers(usersJson.users)
      setInvitations(invitationsJson.invitations || [])
      syncDrafts(usersJson.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => (user.email + " " + (user.name || "")).toLowerCase().includes(query))
  }, [search, users])

  const updateStatus = async (userId: string, status: string) => {
    setError(null)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error || "No se pudo actualizar el estado")
      return
    }
    await loadData()
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) return
    setError(null)
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.error || "No se pudo eliminar el usuario")
      return
    }
    setMessage("Usuario eliminado correctamente")
    await loadData()
  }

  const savePricing = async (userId: string) => {
    const draft = priceDrafts[userId]
    const res = await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        label: draft.label || "Plan personalizado",
        monthlyPrice: draft.monthlyPrice ? Number(draft.monthlyPrice) : undefined,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error || "No se pudo guardar el precio")
      return
    }
    setMessage("Precio actualizado")
    await loadData()
  }

  const saveModules = async (userId: string) => {
    const res = await fetch("/api/admin/modules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, modules: moduleDrafts[userId] }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error || "No se pudieron guardar los módulos")
      return
    }
    setMessage("Módulos actualizados")
    await loadData()
  }

  const loadActivity = async (userId: string) => {
    setActivityLoading((current) => ({ ...current, [userId]: true }))
    const res = await fetch(`/api/admin/users/${userId}/activity`)
    const data = await res.json().catch(() => null)
    if (res.ok) {
      setActivity((current) => ({ ...current, [userId]: data.loginEvents || [] }))
    } else {
      setError(data?.error || "No se pudo cargar la actividad")
    }
    setActivityLoading((current) => ({ ...current, [userId]: false }))
  }

  const sendInvitation = async (userId: string) => {
    const res = await fetch(`/api/admin/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.error || "No se pudo crear la invitación")
      return
    }
    if (data.invitation?.token) {
      setMessage(`${window.location.origin}/invitacion/${data.invitation.token}`)
    }
    await loadData()
  }

  const resendInvitation = async (invitationId: string) => {
    const res = await fetch(`/api/admin/invitations/${invitationId}/resend`, { method: "POST" })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.error || "No se pudo regenerar la invitación")
      return
    }
    if (data.invitation?.token) {
      setMessage(`${window.location.origin}/invitacion/${data.invitation.token}`)
    }
    await loadData()
  }

  const handleCreateUser = async () => {
    setCreating(true)
    setMessage(null)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        email: form.email,
        name: form.name,
        sendInvitation: form.sendInvitation,
      }
      if (form.priceLabel) payload.priceLabel = form.priceLabel
      if (form.monthlyPrice) payload.monthlyPrice = Number(form.monthlyPrice)
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "No se pudo crear el usuario")
      setForm({ email: "", name: "", priceLabel: "", monthlyPrice: "", sendInvitation: true })
      if (data.invitation?.token) {
        setMessage(`${window.location.origin}/invitacion/${data.invitation.token}`)
      } else {
        setMessage("Usuario creado")
      }
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      INVITED: "secondary",
      PAUSED: "outline",
      ARCHIVED: "destructive",
      PENDING: "secondary",
    }
    const labels: Record<string, string> = {
      ACTIVE: "Activo",
      INVITED: "Invitado",
      PAUSED: "Pausado",
      ARCHIVED: "Archivado",
      PENDING: "Pendiente",
    }
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>
  }

  const getProfileBadge = (user: AdminUser) => {
    if (user.profileCompletion === 3) return <Badge className="bg-green-100 text-green-700">✓ Completo</Badge>
    if (user.profileCompletion > 0) return <Badge variant="secondary">{user.profileCompletion}/3 pasos</Badge>
    return null
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6 px-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground">Gestiona usuarios, módulos, precios y evoluciones</p>
        </div>
        <div className="w-full md:w-72">
          <Label htmlFor="admin-search">Buscar</Label>
          <Input id="admin-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Email o nombre..." />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      {message && <p className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded break-all">{message}</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Usuarios totales</p>
            <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Activos</p>
            <p className="text-3xl font-bold text-emerald-600">{stats?.activeUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Invitaciones pendientes</p>
            <p className="text-3xl font-bold text-amber-600">{stats?.pendingInvitations || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Logins hoy</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.loginsToday || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Alta de usuario</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Etiqueta de precio</Label>
              <Input value={form.priceLabel} onChange={(e) => setForm((current) => ({ ...current, priceLabel: e.target.value }))} />
            </div>
            <div>
              <Label>Precio mensual</Label>
              <Input value={form.monthlyPrice} onChange={(e) => setForm((current) => ({ ...current, monthlyPrice: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sendInvitation" checked={form.sendInvitation} onCheckedChange={(checked) => setForm((current) => ({ ...current, sendInvitation: checked === true }))} />
            <Label htmlFor="sendInvitation">Crear invitación automáticamente</Label>
          </div>
          <Button onClick={handleCreateUser} disabled={creating}>{creating ? "Creando..." : "Crear usuario"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          {loading ? <p>Cargando...</p> : filteredUsers.map((user) => (
            <div key={user.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{user.name || user.email}</span>
                    {getStatusBadge(user.status)}
                    {getProfileBadge(user)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateShort(user.createdAt)}</span>
                    <span>Último: {formatDate(user.lastLoginAt)}</span>
                    <span>Logins: {user.loginCount}</span>
                    <span>Días: {user.daysActive}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {user.status === "PAUSED" || user.status === "ARCHIVED" ? (
                    <Button variant="default" size="sm" className="h-8" onClick={() => updateStatus(user.id, "ACTIVE")}>Activar</Button>
                  ) : user.status === "ACTIVE" ? (
                    <Button variant="outline" size="sm" className="h-8" onClick={() => updateStatus(user.id, "PAUSED")}>Pausar</Button>
                  ) : null}
                  {user.status === "INVITED" && (
                    <Button variant="outline" size="sm" className="h-8" onClick={() => sendInvitation(user.id)}>📧 Reenviar</Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                    {expandedUser === user.id ? "−" : "+"} Detalles
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8" onClick={() => deleteUser(user.id, user.name || user.email)}>🗑️</Button>
                </div>
              </div>

              {expandedUser === user.id && (
                <>
                  <Separator className="my-4" />
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="h-4 w-4" />
                        <span className="font-medium text-sm">Peso</span>
                      </div>
                      {user.recentWeight ? (
                        <div>
                          <p className="text-2xl font-bold">{user.recentWeight} kg</p>
                          {user.weightChange !== null && (
                            <p className={`text-xs flex items-center gap-1 ${user.weightChange < 0 ? "text-green-600" : "text-red-600"}`}>
                              {user.weightChange < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                              {Math.abs(user.weightChange)} kg (última semana)
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin datos</p>
                      )}
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Utensils className="h-4 w-4" />
                        <span className="font-medium text-sm">Comidas</span>
                      </div>
                      <p className="text-2xl font-bold">{user.mealsCompleted}</p>
                      <p className="text-xs text-muted-foreground">comidas registradas</p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="h-4 w-4" />
                        <span className="font-medium text-sm">Entrenos</span>
                      </div>
                      <p className="text-2xl font-bold">{user.workoutsCompleted}</p>
                      <p className="text-xs text-muted-foreground">sesiones completadas</p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium text-sm">Onboarding</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {user.hasProfile ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-amber-500" />}
                          <span>Perfil</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {user.hasGoal ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-amber-500" />}
                          <span>Objetivo</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {user.hasMealPlan ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-amber-500" />}
                          <span>Plan nutricional</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Módulos</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(moduleDrafts[user.id] || []).map((module) => (
                          <label key={module.moduleKey} className="flex items-center gap-2 rounded border p-2 text-sm">
                            <Checkbox
                              checked={module.enabled}
                              onCheckedChange={(checked) => setModuleDrafts((current) => ({
                                ...current,
                                [user.id]: (current[user.id] || []).map((item) => item.moduleKey === module.moduleKey ? { ...item, enabled: checked === true } : item),
                              }))}
                            />
                            <span>{module.moduleKey}</span>
                          </label>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => saveModules(user.id)}>Guardar módulos</Button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Precio</p>
                      <div>
                        <Label className="text-xs">Etiqueta</Label>
                        <Input value={priceDrafts[user.id]?.label || ""} onChange={(e) => setPriceDrafts((current) => ({ ...current, [user.id]: { ...(current[user.id] || { label: "", monthlyPrice: "" }), label: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Mensual (€)</Label>
                        <Input value={priceDrafts[user.id]?.monthlyPrice || ""} onChange={(e) => setPriceDrafts((current) => ({ ...current, [user.id]: { ...(current[user.id] || { label: "", monthlyPrice: "" }), monthlyPrice: e.target.value } }))} />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => savePricing(user.id)}>Guardar precio</Button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Historial de accesos</p>
                      <Button variant="outline" size="sm" onClick={() => loadActivity(user.id)} disabled={activityLoading[user.id]}>
                        {activityLoading[user.id] ? "Cargando..." : "Ver actividad"}
                      </Button>
                      <div className="space-y-2 text-xs max-h-40 overflow-y-auto">
                        {(activity[user.id] || []).slice(0, 10).map((event) => (
                          <div key={event.id} className="rounded border p-2">
                            <p>{formatDate(event.createdAt)}</p>
                            <p className="text-muted-foreground">{event.ip || "IP no registrada"}</p>
                          </div>
                        ))}
                        {activity[user.id] && activity[user.id].length === 0 && <p className="text-muted-foreground">Sin actividad registrada.</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Invitaciones ({invitations.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p>Cargando...</p> : invitations.length === 0 ? <p className="text-sm text-muted-foreground">No hay invitaciones todavía.</p> : invitations.map((invitation) => (
            <div key={invitation.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{invitation.name || invitation.email}</p>
                  {getStatusBadge(invitation.status)}
                </div>
                <p className="text-sm text-muted-foreground">{invitation.email}</p>
                <p className="text-xs text-muted-foreground">Creada: {formatDate(invitation.createdAt)} · Expira: {formatDate(invitation.expiresAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => resendInvitation(invitation.id)}>Reenviar email</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}