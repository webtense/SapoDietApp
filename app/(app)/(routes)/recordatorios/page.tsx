"use client"

import { useEffect, useState } from "react"
import { Activity, Clock, MessageSquare, Plus, Trash2, Bell, AlertCircle, CheckCircle2, Smartphone, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Reminder {
  id: string
  kind?: string
  system?: boolean
  title: string
  time: string
  days: string[]
  enabled: boolean
  lastError?: string | null
}

function base64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(normalized)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export default function RecordatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [newReminder, setNewReminder] = useState({ title: "", time: "09:00", days: ["1", "2", "3", "4", "5"] })

  const daysMap: Record<string, string> = {
    "0": "Dom", "1": "Lun", "2": "Mar", "3": "Mié", "4": "Jue", "5": "Vie", "6": "Sáb"
  }

  useEffect(() => {
    const load = async () => {
      const [remindersRes] = await Promise.all([fetch("/api/reminders")])
      if (remindersRes.ok) {
        const data = await remindersRes.json()
        setReminders(data.reminders || [])
      }

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        setPushEnabled(!!sub)
      }

      setLoading(false)
    }
    load()
  }, [])

  const enablePush = async () => {
    try {
      setPushLoading(true)
      if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        toast.error("Este navegador no soporta notificaciones push")
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast.error("Debes permitir las notificaciones para activar los avisos push")
        return
      }

      const keyRes = await fetch("/api/push/vapid-public-key")
      const keyData = await keyRes.json().catch(() => null)
      if (!keyRes.ok || !keyData?.publicKey) {
        toast.error(keyData?.error || "No se pudo cargar la clave pública VAPID")
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(keyData.publicKey),
      })

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => null)
        toast.error(data?.error || "No se pudo guardar la suscripción push")
        return
      }

      setPushEnabled(true)
      toast.success("Notificaciones push activadas")
    } finally {
      setPushLoading(false)
    }
  }

  const disablePush = async () => {
    try {
      setPushLoading(true)
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe().catch(() => null)
      }
      setPushEnabled(false)
      toast.success("Notificaciones push desactivadas")
    } finally {
      setPushLoading(false)
    }
  }

  const toggleDay = (day: string) => {
    setNewReminder(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort()
    }))
  }

  const createReminder = async () => {
    if (!newReminder.title) {
      toast.error("El título es obligatorio")
      return
    }
    if (newReminder.days.length === 0) {
      toast.error("Selecciona al menos un día")
      return
    }
    
    try {
      setSaving(true)
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReminder),
      })
      
      const data = await res.json()

      if (res.ok) {
        setReminders([...reminders, data.reminder])
        setShowForm(false)
        setNewReminder({ title: "", time: "09:00", days: ["1", "2", "3", "4", "5"] })
        toast.success("Recordatorio guardado")
      } else {
        toast.error(data.error || "Error al guardar el recordatorio")
      }
    } catch (err) {
      toast.error("Error de conexión al servidor")
    } finally {
      setSaving(false)
    }
  }

  const toggleReminder = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      })
      
      if (res.ok) {
        setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !enabled } : r))
        toast.success(enabled ? "Recordatorio desactivado" : "Recordatorio activado")
      } else {
        toast.error("No se pudo actualizar el estado")
      }
    } catch (err) {
      toast.error("Error de conexión")
    }
  }

  const deleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" })
      if (res.ok) {
        setReminders(reminders.filter(r => r.id !== id))
        toast.success("Recordatorio eliminado")
      } else {
        toast.error("No se pudo eliminar")
      }
    } catch (err) {
      toast.error("Error de conexión")
    }
  }

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recordatorios</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <Card className="border-emerald-100 bg-emerald-50/50">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <p className="font-medium">Canales automáticos v3.3</p>
            </div>
            <p className="text-sm text-muted-foreground">Los avisos se envían siempre por Push y WhatsApp. El recordatorio de entreno se crea solo a las 19:00 según tu frecuencia.</p>
          </div>
          <Button variant={pushEnabled ? "outline" : "default"} onClick={pushEnabled ? disablePush : enablePush} disabled={pushLoading}>
            <Smartphone className="mr-2 h-4 w-4" />
            {pushLoading ? "Procesando..." : pushEnabled ? "Desactivar push" : "Activar push"}
          </Button>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo recordatorio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input 
                value={newReminder.title} 
                onChange={(e) => setNewReminder(p => ({ ...p, title: e.target.value }))}
                placeholder="Ej: Tomar agua"
              />
            </div>
            <div>
              <Label>Hora</Label>
              <Input 
                type="time" 
                value={newReminder.time}
                onChange={(e) => setNewReminder(p => ({ ...p, time: e.target.value }))}
              />
            </div>
            <div>
              <Label>Días</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(daysMap).map(([num, name]) => (
                  <button
                    key={num}
                    onClick={() => toggleDay(num)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      newReminder.days.includes(num)
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
               <Button onClick={createReminder} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
               <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
             </div>
          </CardContent>
        </Card>
      )}

      {reminders.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tienes recordatorios</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Crear recordatorio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className={reminder.enabled ? "" : "opacity-60"}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleReminder(reminder.id, reminder.enabled)}>
                    {reminder.enabled ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{reminder.title}</p>
                      {reminder.kind === "WORKOUT" && <Badge variant="secondary">Auto-entreno</Badge>}
                      {reminder.system && <Badge variant="outline">Sistema</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reminder.days.map((day) => (
                        <span key={day} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {daysMap[day]}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {reminder.time}
                    </p>
                    {reminder.lastError && <p className="mt-1 text-xs text-amber-700">Último error: {reminder.lastError}</p>}
                  </div>
                </div>
                {!reminder.system && (
                  <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
