"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Power } from "lucide-react"

type Group = "UPPER" | "LOWER" | "FULL"

interface MachineModelInfo {
  id: string
  name: string
  group: Group
  description: string | null
  instructions: string | null
  tips: string | null
  recommendedWeight: number | null
}

interface GymMachineItem {
  id: string
  active: boolean
  assetNumber: string | null
  notes: string | null
  machineModel: MachineModelInfo
}

interface GymDetail {
  id: string
  name: string
  location: string | null
  createdById: string | null
  machines: GymMachineItem[]
}

const GROUP_LABEL: Record<Group, string> = {
  UPPER: "Tren Superior",
  LOWER: "Tren Inferior",
  FULL: "Cuerpo Completo",
}

export default function GimnasioDetallePage() {
  const params = useParams<{ id: string }>()
  const gymId = params.id

  const [gym, setGym] = useState<GymDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [group, setGroup] = useState<Group>("FULL")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [tips, setTips] = useState("")
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gymRes, meRes] = await Promise.all([
        fetch(`/api/gyms/${gymId}`),
        fetch("/api/auth/me").catch(() => null),
      ])
      const gymData = await gymRes.json()
      if (!gymRes.ok) throw new Error(gymData.error || "No se pudo cargar el gimnasio")
      setGym(gymData.gym)

      if (meRes && meRes.ok) {
        const meData = await meRes.json()
        setIsOwner(meData?.user?.id && meData.user.id === gymData.gym?.createdById)
      } else {
        setIsOwner(false)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando el gimnasio")
    } finally {
      setLoading(false)
    }
  }, [gymId])

  useEffect(() => {
    load()
  }, [load])

  async function handleAddMachine() {
    if (!name.trim()) {
      toast.error("Indica el nombre de la máquina")
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`/api/gyms/${gymId}/machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          group,
          description: description.trim() || undefined,
          instructions: instructions.trim() || undefined,
          tips: tips.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo añadir la máquina")
      toast.success("Máquina añadida")
      setName("")
      setDescription("")
      setInstructions("")
      setTips("")
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error añadiendo la máquina")
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive(machine: GymMachineItem) {
    setTogglingId(machine.id)
    try {
      const res = await fetch(`/api/gyms/${gymId}/machines/${machine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !machine.active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la máquina")
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error actualizando la máquina")
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando gimnasio…</p>
  }

  if (!gym) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Gimnasio no encontrado.</p>
  }

  const groups: Group[] = ["UPPER", "LOWER", "FULL"]
  const machinesByGroup = groups.map((g) => ({
    group: g,
    machines: gym.machines.filter((m) => m.machineModel.group === g),
  }))

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <Link href="/gimnasios" className="flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" /> Gimnasios
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{gym.name}</h1>
          {gym.location && <p className="text-sm text-muted-foreground">{gym.location}</p>}
        </div>
        {isOwner && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Añadir máquina
          </Button>
        )}
      </div>

      {isOwner && showForm && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <Label className="text-xs">Nombre de la máquina</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Press de banca" />
            </div>
            <div>
              <Label className="text-xs">Grupo muscular</Label>
              <div className="flex gap-2 mt-1">
                {groups.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroup(g)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      group === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {GROUP_LABEL[g]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Descripción (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Instrucciones (opcional)</Label>
              <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Consejos (opcional)</Label>
              <Input value={tips} onChange={(e) => setTips(e.target.value)} />
            </div>
            <Button size="sm" disabled={creating} onClick={handleAddMachine}>
              {creating ? "Guardando…" : "Guardar máquina"}
            </Button>
          </CardContent>
        </Card>
      )}

      {machinesByGroup.map(({ group: g, machines }) => (
        <div key={g} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{GROUP_LABEL[g]}</h2>
          {machines.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin máquinas en este grupo.</p>
          )}
          {machines.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{m.machineModel.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.active ? "default" : "secondary"}>
                      {m.active ? "Activa" : "Inactiva"}
                    </Badge>
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={togglingId === m.id}
                        onClick={() => handleToggleActive(m)}
                        aria-label="Activar o desactivar máquina"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              {(m.machineModel.description || m.machineModel.instructions || m.machineModel.tips) && (
                <CardContent className="space-y-1 text-sm">
                  {m.machineModel.description && <p><strong>Qué es:</strong> {m.machineModel.description}</p>}
                  {m.machineModel.instructions && <p><strong>Cómo usar:</strong> {m.machineModel.instructions}</p>}
                  {m.machineModel.tips && <p><strong>Recomendaciones:</strong> {m.machineModel.tips}</p>}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
