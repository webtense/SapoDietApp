"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  pendingInvitations: number
  loginsToday: number
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  status: string
  lastLoginAt: string | null
  loginCount: number
  pricing: { label: string; monthlyPrice: number | null } | null
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [form, setForm] = useState({ email: "", name: "", priceLabel: "", monthlyPrice: "", sendInvitation: true })

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/users"),
      ])
      if (!statsRes.ok) throw new Error("No se pudo cargar el dashboard")
      if (!usersRes.ok) throw new Error("No se pudo cargar la lista")
      const statsJson = await statsRes.json()
      const usersJson = await usersRes.json()
      setStats(statsJson.stats)
      setUsers(usersJson.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleCreateUser = async () => {
    setCreating(true)
    setInviteMessage(null)
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
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear el usuario")
      }
      setForm({ email: "", name: "", priceLabel: "", monthlyPrice: "", sendInvitation: true })
      if (data.invitation?.token) {
        setInviteMessage(`Invitación creada. Comparte el enlace: ${window.location.origin}/invitacion/${data.invitation.token}`)
      } else {
        setInviteMessage("Usuario creado sin invitación")
      }
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setCreating(false)
    }
  }

  const updateStatus = async (userId: string, status: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    await loadData()
  }

  const sendInvitation = async (userId: string) => {
    const res = await fetch(`/api/admin/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (res.ok && data.invitation?.token) {
      setInviteMessage(`Invitación enviada. Enlace: ${window.location.origin}/invitacion/${data.invitation.token}`)
    } else {
      setInviteMessage(data.error || "No se pudo enviar la invitación")
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold">Panel de administración</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {inviteMessage && <p className="text-sm text-emerald-600">{inviteMessage}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !stats ? (
            <p>Cargando...</p>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios totales</p>
                <p className="text-2xl font-semibold">{stats.totalUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-semibold">{stats.activeUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invitaciones pendientes</p>
                <p className="text-2xl font-semibold">{stats.pendingInvitations}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Logins hoy</p>
                <p className="text-2xl font-semibold">{stats.loginsToday}</p>
              </div>
            </div>
          ) : (
            <p>No hay datos</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crear usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Descripción de precio</Label>
              <Input value={form.priceLabel} onChange={(e) => setForm((f) => ({ ...f, priceLabel: e.target.value }))} />
            </div>
            <div>
              <Label>Precio mensual (€)</Label>
              <Input value={form.monthlyPrice} onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="sendInvitation"
              type="checkbox"
              checked={form.sendInvitation}
              onChange={(e) => setForm((f) => ({ ...f, sendInvitation: e.target.checked }))}
            />
            <Label htmlFor="sendInvitation">Enviar invitación automáticamente</Label>
          </div>
          <Button onClick={handleCreateUser} disabled={creating}>
            {creating ? "Creando..." : "Crear usuario"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="border rounded-lg p-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-medium">{u.name || u.email}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Estado: {u.status} · Último acceso: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => sendInvitation(u.id)}>
                        Enviar invitación
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(u.id, "ACTIVE")}>Activar</Button>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(u.id, "PAUSED")}>Pausar</Button>
                      <Button variant="destructive" size="sm" onClick={() => updateStatus(u.id, "ARCHIVED")}>
                        Archivar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
