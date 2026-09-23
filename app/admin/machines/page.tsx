"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface MachineModel {
  id: string
  name: string
  group: string
  description?: string
  instructions?: string
  tips?: string
  recommendedWeight?: number
  _count: { gymMachines: number }
}

interface Gym {
  id: string
  name: string
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<MachineModel[]>([])
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assignGym, setAssignGym] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    group: "FULL" as "UPPER" | "LOWER" | "FULL",
    description: "",
    instructions: "",
    tips: "",
    recommendedWeight: "",
    gymId: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [machinesRes, gymsRes] = await Promise.all([
        fetch("/api/admin/machines"),
        fetch("/api/admin/gyms"),
      ])
      const machinesData = await machinesRes.json()
      const gymsData = await gymsRes.json()
      if (machinesData.ok) setMachines(machinesData.models)
      if (gymsData.ok) setGyms(gymsData.gyms)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    const payload = {
      name: formData.name,
      group: formData.group,
      description: formData.description,
      instructions: formData.instructions,
      tips: formData.tips,
      recommendedWeight: formData.recommendedWeight
        ? parseFloat(formData.recommendedWeight)
        : undefined,
      ...(assignGym && formData.gymId && { gymId: formData.gymId }),
    }

    try {
      const url = formMode === "create"
        ? "/api/admin/machines"
        : `/api/admin/machines/${editingId}`
      const method = formMode === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setFormMode(null)
        setAssignGym(false)
        resetForm()
        loadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      group: "FULL",
      description: "",
      instructions: "",
      tips: "",
      recommendedWeight: "",
      gymId: "",
    })
    setEditingId(null)
    setAssignGym(false)
  }

  function handleEdit(machine: MachineModel) {
    setFormData({
      name: machine.name,
      group: machine.group as "UPPER" | "LOWER" | "FULL",
      description: machine.description || "",
      instructions: machine.instructions || "",
      tips: machine.tips || "",
      recommendedWeight: machine.recommendedWeight?.toString() || "",
      gymId: "",
    })
    setEditingId(machine.id)
    setFormMode("edit")
  }

  const upperMachines = machines.filter((m) => m.group === "UPPER")
  const lowerMachines = machines.filter((m) => m.group === "LOWER")
  const fullMachines = machines.filter((m) => m.group === "FULL")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Máquinas</h1>
          <p className="text-sm text-muted-foreground">
            Crear y editar máquinas de gimnasio, asignarlas a Planet Fitness
          </p>
        </div>
        {formMode === null && (
          <Button onClick={() => setFormMode("create")}>Nueva máquina</Button>
        )}
      </div>

      {formMode && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej. Prensa de piernas"
              />
            </div>
            <div>
              <Label htmlFor="group">Grupo *</Label>
              <Select
                value={formData.group}
                onValueChange={(value: "UPPER" | "LOWER" | "FULL") =>
                  setFormData({ ...formData, group: value })
                }
              >
                <SelectTrigger id="group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPPER">Tren Superior</SelectItem>
                  <SelectItem value="LOWER">Tren Inferior</SelectItem>
                  <SelectItem value="FULL">Full Body</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Qué es y para qué sirve"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="instructions">Instrucciones</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              placeholder="Cómo usar correctamente"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tips">Recomendaciones</Label>
            <Textarea
              id="tips"
              value={formData.tips}
              onChange={(e) =>
                setFormData({ ...formData, tips: e.target.value })
              }
              placeholder="Consejos y precauciones"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Peso recomendado (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.recommendedWeight}
                onChange={(e) =>
                  setFormData({ ...formData, recommendedWeight: e.target.value })
                }
                placeholder="Ej. 50"
              />
            </div>
            {formMode === "create" && (
              <div className="flex items-end gap-2">
                <Checkbox
                  id="assignGym"
                  checked={assignGym}
                  onCheckedChange={(checked) => setAssignGym(!!checked)}
                />
                <Label htmlFor="assignGym" className="cursor-pointer">
                  Asignar a gimnasio
                </Label>
              </div>
            )}
          </div>

          {assignGym && (
            <div>
              <Label htmlFor="gym">Gimnasio</Label>
              <Select
                value={formData.gymId}
                onValueChange={(value) =>
                  setFormData({ ...formData, gymId: value })
                }
              >
                <SelectTrigger id="gym">
                  <SelectValue placeholder="Elige un gimnasio" />
                </SelectTrigger>
                <SelectContent>
                  {gyms.map((gym) => (
                    <SelectItem key={gym.id} value={gym.id}>
                      {gym.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              {formMode === "create" ? "Crear" : "Guardar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFormMode(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="space-y-6">
          {upperMachines.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Tren Superior</h2>
              <div className="grid gap-3">
                {upperMachines.map((m) => (
                  <Card key={m.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m._count.gymMachines} gimnasio(s)
                        {m.recommendedWeight && ` • ${m.recommendedWeight} kg`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(m)}
                    >
                      Editar
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {lowerMachines.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Tren Inferior</h2>
              <div className="grid gap-3">
                {lowerMachines.map((m) => (
                  <Card key={m.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m._count.gymMachines} gimnasio(s)
                        {m.recommendedWeight && ` • ${m.recommendedWeight} kg`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(m)}
                    >
                      Editar
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {fullMachines.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Full Body</h2>
              <div className="grid gap-3">
                {fullMachines.map((m) => (
                  <Card key={m.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m._count.gymMachines} gimnasio(s)
                        {m.recommendedWeight && ` • ${m.recommendedWeight} kg`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(m)}
                    >
                      Editar
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {machines.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              No hay máquinas aún. Crea la primera.
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
