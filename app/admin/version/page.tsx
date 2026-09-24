"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Status = {
  current: { version: string; build: string; deployedAt: string | null }
  lastForceUpdateAt: string | null
  history: Array<{ id: string; version: string; commit: string | null; deployedAt: string; status: string; usersOnVersion: number }>
  flags: Array<{ id: string; name: string; enabled: boolean; description: string | null }>
  scheduled: Array<{ id: string; version: string; scheduledFor: string; status: string }>
  adoption: { days: number; totalUsers: number; rows: Array<{ version: string; users: number; percent: number }> }
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-ES") : "—")

export default function AdminVersionPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [scheduleAt, setScheduleAt] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/version/control", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus(await res.json())
    } catch (err) {
      toast.error("No se pudo cargar el estado de versiones", { description: String(err) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (payload: Record<string, unknown>, okMessage: string) => {
    setBusy(true)
    try {
      const res = await fetch("/api/admin/version/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success(okMessage)
      await load()
    } catch (err) {
      toast.error("Acción fallida", { description: String(err) })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="mx-auto max-w-6xl py-8 text-sm text-muted-foreground">Cargando…</p>
  if (!status) return <p className="mx-auto max-w-6xl py-8 text-sm text-red-600">Sin datos.</p>

  const pending = status.scheduled.filter((s) => s.status === "PENDING")

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Versiones y despliegue</h1>
        <p className="text-sm text-muted-foreground">
          Versión servida: <span className="font-mono font-semibold text-foreground">v{status.current.version}</span> · build{" "}
          <span className="font-mono">{status.current.build}</span> · desplegada {fmt(status.current.deployedAt)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Adopción (últimos {status.adoption.days} días)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {status.adoption.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos todavía. Se registran cuando los usuarios abren la app.</p>
            ) : (
              status.adoption.rows.map((row) => (
                <div key={row.version}>
                  <div className="flex justify-between text-sm">
                    <span className="font-mono">v{row.version}</span>
                    <span>
                      {row.users} usuarios · {row.percent}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded bg-muted">
                    <div
                      className={`h-2 rounded ${row.version === status.current.version ? "bg-emerald-500" : "bg-amber-400"}`}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">Total usuarios activos: {status.adoption.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Control de actualización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button
                disabled={busy}
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (window.confirm("Todos los dispositivos conectados recargarán la app en menos de 30 s. ¿Continuar?")) {
                    act({ action: "FORCE_UPDATE" }, "Actualización forzada enviada")
                  }
                }}
              >
                Forzar actualización en todos los dispositivos
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">Última forzada: {fmt(status.lastForceUpdateAt)}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="schedule-at">
                Programar actualización
              </label>
              <div className="flex gap-2">
                <input
                  id="schedule-at"
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <Button
                  disabled={busy || !scheduleAt}
                  onClick={() =>
                    act(
                      { action: "SCHEDULE_UPDATE", scheduledFor: new Date(scheduleAt).toISOString() },
                      "Actualización programada",
                    ).then(() => setScheduleAt(""))
                  }
                >
                  Programar
                </Button>
              </div>
              {pending.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {pending.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded border px-3 py-2">
                      <span>{fmt(s.scheduledFor)}</span>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ action: "CANCEL_SCHEDULED", id: s.id }, "Cancelada")}>
                        Cancelar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Rollback de imagen</p>
              <p>Se hace en el servidor, no desde aquí:</p>
              <code className="mt-1 block font-mono">docker service rollback sapofit</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {status.flags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm">{flag.name}</p>
                  {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
                </div>
                <Button
                  size="sm"
                  variant={flag.enabled ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => act({ action: "TOGGLE_FLAG", flagName: flag.name, enabled: !flag.enabled }, `${flag.name} → ${flag.enabled ? "OFF" : "ON"}`)}
                >
                  {flag.enabled ? "ON" : "OFF"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de versiones</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2">Versión</th>
                  <th>Desplegada</th>
                  <th>Estado</th>
                  <th className="text-right">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {status.history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2 font-mono">v{h.version}</td>
                    <td>{fmt(h.deployedAt)}</td>
                    <td>{h.status}</td>
                    <td className="text-right">{h.usersOnVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
