"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ExerciseAliasEditorProps {
  /** id de la GymMachine (máquina física en el gimnasio) a la que se asocia el alias */
  gymMachineId: string
  /** alias actual del usuario para esta máquina, si lo tiene */
  currentAlias: string | null | undefined
  /** nombre mostrado cuando no se está editando (alias o nombre en castellano de la máquina) */
  displayName: string
  /** nombre base de la máquina, usado como placeholder al editar */
  placeholder: string
  /** callback tras guardar correctamente (p.ej. recargar el entreno actual) */
  onSaved?: () => void
}

export default function ExerciseAliasEditor({
  gymMachineId,
  currentAlias,
  displayName,
  placeholder,
  onSaved,
}: ExerciseAliasEditorProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(currentAlias || "")
  const [saving, setSaving] = useState(false)

  function cancel() {
    setDraft(currentAlias || "")
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/user/exercise-alias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymMachineId, alias: draft.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar el alias")
      setEditing(false)
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando el alias")
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          maxLength={60}
          className="h-8"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") cancel()
          }}
        />
        <Button size="sm" disabled={saving} onClick={handleSave}>
          Guardar
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={cancel}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <span className="flex items-center gap-1">
      {displayName}
      <Button
        size="sm"
        variant="ghost"
        aria-label="Editar nombre"
        className="h-6 w-6 p-0"
        onClick={() => { setDraft(currentAlias || ""); setEditing(true) }}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </span>
  )
}
