"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface EditableCardProps {
  value: number | null
  unit: string
  min?: number
  max?: number
  onSave: (value: number) => Promise<void>
  /** Render del valor en modo lectura (por defecto: value unit) */
  children?: React.ReactNode
  className?: string
}

export default function EditableCard({
  value,
  unit,
  min = 0,
  max = 500,
  onSave,
  children,
  className,
}: EditableCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value != null ? String(value) : "")
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [editing, value])

  const startEditing = () => {
    if (saving) return
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setDraft("")
  }

  const commit = async () => {
    const num = Number(draft.replace(",", "."))
    if (draft.trim() === "" || Number.isNaN(num)) {
      cancel()
      return
    }
    if (num < min || num > max) {
      toast.error(`El valor debe estar entre ${min} y ${max} ${unit}`)
      return
    }
    if (num === value) {
      cancel()
      return
    }
    setSaving(true)
    try {
      await onSave(num)
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      commit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancel()
    }
  }

  if (saving) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando...
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          step="0.1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-2xl font-bold outline-none ring-2 ring-primary/40"
        />
      </div>
    )
  }

  return (
    <div
      className={`${className ?? ""} cursor-pointer rounded-md transition-colors hover:bg-black/5`}
      onDoubleClick={startEditing}
      title="Doble click para editar"
    >
      {children}
    </div>
  )
}
