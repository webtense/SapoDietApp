"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { trackVersionEvent } from "@/lib/analytics/version-tracker"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "sapofit-pwa-dismissed-at"
const DISMISS_DAYS = 7

export function PWAInstaller() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const install = async () => {
      const prompt = deferredRef.current
      if (!prompt) return
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === "accepted") {
        toast.success("SapoFit instalado en tu dispositivo")
      } else {
        try {
          localStorage.setItem(DISMISS_KEY, String(Date.now()))
        } catch {
          // sin storage: se volverá a ofrecer
        }
      }
      deferredRef.current = null
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent

      try {
        const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0)
        if (dismissed && Date.now() - dismissed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
      } catch {
        // ignorar
      }

      trackVersionEvent("PWA_PROMPT_SHOWN")
      toast.info("Instala SapoFit como app", {
        description: "Acceso directo en tu pantalla de inicio y modo offline",
        duration: 12_000,
        action: { label: "Instalar", onClick: () => void install() },
        onDismiss: () => {
          try {
            localStorage.setItem(DISMISS_KEY, String(Date.now()))
          } catch {
            // ignorar
          }
        },
      })
    }

    const onAppInstalled = () => {
      deferredRef.current = null
      trackVersionEvent("PWA_INSTALLED")
      toast.success("SapoFit instalado", { description: "Ya puedes abrirlo desde tu pantalla de inicio" })
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  return null
}
