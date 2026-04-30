"use client"

import { useState } from "react"
import { Zap, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaywallDialogProps {
  onClose: () => void
}

const PRO_FEATURES = [
  "Generación ilimitada de planes",
  "Recordatorios por WhatsApp",
  "Adaptación del plan con IA",
  "Acceso a todos los módulos",
]

export function PaywallDialog({ onClose }: PaywallDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/payments/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl mx-4 mb-0 sm:mb-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-green-600 uppercase tracking-wider">SapoFit PRO</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Desbloquea todo por{" "}
              <span className="text-green-500">4,99 €/mes</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Has alcanzado el límite del plan gratuito (1 plan/mes). Hazte PRO para seguir generando planes sin límite.
        </p>

        <ul className="space-y-2 mb-6">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Hacerme PRO — 4,99 €/mes"
          )}
        </Button>

        <p className="mt-3 text-center text-xs text-gray-400">
          Cancela cuando quieras · Sin permanencia
        </p>
      </div>
    </div>
  )
}
