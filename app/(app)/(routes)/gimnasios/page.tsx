"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dumbbell, MapPin, Plus } from "lucide-react"

interface GymListItem {
  id: string
  name: string
  location: string | null
  createdBy: { id: string; name: string | null } | null
  _count: { machines: number }
}

export default function GimnasiosPage() {
  const [gyms, setGyms] = useState<GymListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGymId, setActiveGymId] = useState<string | null>(null)
  const [activating, setActivating] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gymsRes, profileRes] = await Promise.all([
        fetch("/api/gyms"),
        fetch("/api/profile"),
      ])
      const gymsData = await gymsRes.json()
      if (!gymsRes.ok) throw new Error(gymsData.error || "No se pudieron cargar los gimnasios")
      setGyms(gymsData.gyms ?? [])

      const profileData = await profileRes.json()
      setActiveGymId(profileData.profile?.gymId ?? null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando gimnasios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleActivate(gymId: string) {
    setActivating(gymId)
    try {
      const res = await fetch("/api/profile/active-gym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo activar el gimnasio")
      setActiveGymId(gymId)
      toast.success("Gimnasio activado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error activando el gimnasio")
    } finally {
      setActivating(null)
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Indica un nombre para el gimnasio")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), location: location.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo crear el gimnasio")
      toast.success("Gimnasio creado")
      setName("")
      setLocation("")
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creando el gimnasio")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Gimnasios</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Crear gimnasio
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gimnasio Fit Center" />
            </div>
            <div>
              <Label className="text-xs">Ubicación (opcional)</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Barcelona" />
            </div>
            <Button size="sm" disabled={creating} onClick={handleCreate}>
              {creating ? "Creando…" : "Guardar gimnasio"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Cargando gimnasios…</p>}

      {!loading && gyms.length === 0 && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Todavía no hay gimnasios públicos. Crea el primero.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {gyms.map((gym) => {
          const isActive = activeGymId === gym.id
          return (
            <Card key={gym.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <Link href={`/gimnasios/${gym.id}`} className="hover:underline">
                    {gym.name}
                  </Link>
                  {isActive && <Badge>Activo</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {gym.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {gym.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" /> {gym._count.machines} máquinas
                  </span>
                  {gym.createdBy?.name && <span>Creado por {gym.createdBy.name}</span>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/gimnasios/${gym.id}`}>
                    <Button size="sm" variant="outline">
                      Ver máquinas
                    </Button>
                  </Link>
                  {!isActive && (
                    <Button size="sm" disabled={activating === gym.id} onClick={() => handleActivate(gym.id)}>
                      {activating === gym.id ? "Activando…" : "Activar"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
