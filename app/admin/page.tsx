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
  lastLoginAt: string | null
  loginCount: number
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de usuarios</h1>
          <p className="text-sm text-muted-foreground">Administra estados, módulos, precios, actividad e invitaciones desde una sola pantalla.</p>
        </div>
        <div className="w-full md:w-72">
          <Label htmlFor="admin-search">Buscar usuario</Label>
          <Input id="admin-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Email o nombre" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-600 break-all">{message}</p>}

      <Card>
        <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
        <CardContent>
          {loading && !stats ? (
            <p>Cargando...</p>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div><p className="text-sm text-muted-foreground">Usuarios totales</p><p className="text-2xl font-semibold">{stats.totalUsers}</p></div>
              <div><p className="text-sm text-muted-foreground">Activos</p><p className="text-2xl font-semibold">{stats.activeUsers}</p></div>
              <div><p className="text-sm text-muted-foreground">Invitaciones pendientes</p><p className="text-2xl font-semibold">{stats.pendingInvitations}</p></div>
              <div><p className="text-sm text-muted-foreground">Logins hoy</p><p className="text-2xl font-semibold">{stats.loginsToday}</p></div>
            </div>
          ) : <p>No hay datos</p>}
        </CardContent>
      </Card>

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
        <CardHeader><CardTitle>Usuarios</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p>Cargando...</p> : filteredUsers.map((user) => (
            <div key={user.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{user.name || user.email}</p>
                    <Badge variant="outline">{user.status}</Badge>
                    {user.latestInvitation && <Badge variant="secondary">Invitación {user.latestInvitation.status}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Último acceso: {formatDate(user.lastLoginAt)} · Logins: {user.loginCount}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => sendInvitation(user.id)}>Enviar invitación</Button>
                  <Button variant="outline" size="sm" onClick={() => updateStatus(user.id, "ACTIVE")}>Activar</Button>
                  <Button variant="outline" size="sm" onClick={() => updateStatus(user.id, "PAUSED")}>Pausar</Button>
                  <Button variant="destructive" size="sm" onClick={() => updateStatus(user.id, "ARCHIVED")}>Archivar</Button>
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
                    <Label>Etiqueta</Label>
                    <Input value={priceDrafts[user.id]?.label || ""} onChange={(e) => setPriceDrafts((current) => ({ ...current, [user.id]: { ...(current[user.id] || { label: "", monthlyPrice: "" }), label: e.target.value } }))} />
                  </div>
                  <div>
                    <Label>Mensual (€)</Label>
                    <Input value={priceDrafts[user.id]?.monthlyPrice || ""} onChange={(e) => setPriceDrafts((current) => ({ ...current, [user.id]: { ...(current[user.id] || { label: "", monthlyPrice: "" }), monthlyPrice: e.target.value } }))} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => savePricing(user.id)}>Guardar precio</Button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Actividad</p>
                  <Button variant="outline" size="sm" onClick={() => loadActivity(user.id)} disabled={activityLoading[user.id]}>
                    {activityLoading[user.id] ? "Cargando..." : "Ver actividad"}
                  </Button>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {(activity[user.id] || []).slice(0, 5).map((event) => (
                      <div key={event.id} className="rounded border p-2">
                        <p>{formatDate(event.createdAt)}</p>
                        <p>{event.ip || "IP no registrada"}</p>
                      </div>
                    ))}
                    {activity[user.id] && activity[user.id].length === 0 && <p>Sin actividad registrada.</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Invitaciones</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p>Cargando...</p> : invitations.length === 0 ? <p className="text-sm text-muted-foreground">No hay invitaciones todavía.</p> : invitations.map((invitation) => (
            <div key={invitation.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{invitation.name || invitation.email}</p>
                  <Badge variant="outline">{invitation.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{invitation.email}</p>
                <p className="text-xs text-muted-foreground">Creada: {formatDate(invitation.createdAt)} · Expira: {formatDate(invitation.expiresAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => resendInvitation(invitation.id)}>Regenerar enlace</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
