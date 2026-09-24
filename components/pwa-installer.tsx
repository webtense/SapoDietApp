"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)

      // Mostrar toast con opción de instalar
      toast.info("SapoFit disponible para instalar", {
        description: "Agrégalo a tu pantalla de inicio para acceso rápido",
        action: {
          label: "Instalar",
          onClick: () => handleInstall(),
        },
        duration: 10000,
      })
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstallable(false)
      toast.success("SapoFit instalado correctamente", {
        description: "Ya puedes acceder desde tu pantalla de inicio",
        duration: 5000,
      })
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      toast.success("🎉 SapoFit instalado en tu dispositivo")
    } else {
      toast.info("Instalación cancelada")
    }

    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  return null
}
