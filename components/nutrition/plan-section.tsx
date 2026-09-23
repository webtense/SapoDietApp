"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface NutritionistPlan {
  id: string
  status: string
  version: number
  extractedText?: string
  mealsJson?: string
  needsReview: boolean
  createdAt: string
}

export function PlanSection() {
  const [plan, setPlan] = useState<NutritionistPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    mealsJson: "",
    equivalencesJson: "",
  })

  useEffect(() => {
    loadPlan()
  }, [])

  async function loadPlan() {
    setLoading(true)
    try {
      const res = await fetch("/api/nutrition/plan/current")
      const data = await res.json()
      if (data.ok) {
        setPlan(data.plan)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append("file", file)
      if (formData.mealsJson) {
        formDataObj.append("mealsJson", formData.mealsJson)
      }

      const res = await fetch("/api/nutrition/plan/import", {
        method: "POST",
        body: formDataObj,
      })

      if (res.ok) {
        setFormData({ mealsJson: "", equivalencesJson: "" })
        setShowForm(false)
        loadPlan()
      }
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <Card className="p-6 text-center text-muted-foreground">Cargando plan...</Card>
  }

  return (
    <div className="space-y-4">
      {plan ? (
        <>
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Plan Activo</h3>
                <p className="text-sm text-muted-foreground">
                  v{plan.version} • {new Date(plan.createdAt).toLocaleDateString("es-ES")}
                </p>
              </div>
              {plan.needsReview && (
                <Badge variant="destructive">Requiere revisión</Badge>
              )}
            </div>
            {plan.extractedText && (
              <p className="text-sm text-muted-foreground border-t pt-2">
                {plan.extractedText.substring(0, 100)}...
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
            >
              Actualizar plan
            </Button>
          </Card>

          {plan.needsReview && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex gap-2 text-sm text-yellow-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Algunas reglas del PDF no se pudieron extraer automáticamente. Por favor, completa manualmente.</span>
            </div>
          )}
        </>
      ) : (
        <Card className="p-6 text-center space-y-3">
          <p className="text-muted-foreground">No hay plan cargado aún</p>
          <Button onClick={() => setShowForm(true)}>
            Cargar plan de nutricionista
          </Button>
        </Card>
      )}

      {showForm && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Cargar o actualizar plan</h3>

          <div>
            <Label htmlFor="pdf">PDF del plan</Label>
            <Input
              id="pdf"
              type="file"
              accept=".pdf"
              disabled={uploading}
              onChange={handleFileUpload}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se extraerá el contenido automáticamente con IA
            </p>
          </div>

          <div>
            <Label htmlFor="meals">Comidas (JSON)</Label>
            <Textarea
              id="meals"
              value={formData.mealsJson}
              onChange={(e) =>
                setFormData({ ...formData, mealsJson: e.target.value })
              }
              placeholder={`{
  "desayuno": {...},
  "mediaMañana": {...},
  ...
}`}
              rows={5}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (formData.mealsJson) {
                  handleFileUpload({
                    target: { files: [] },
                  } as any)
                }
              }}
              disabled={uploading || !formData.mealsJson}
            >
              {uploading ? "Cargando..." : "Guardar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setFormData({ mealsJson: "", equivalencesJson: "" })
              }}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
