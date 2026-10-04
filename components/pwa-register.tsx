"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    swRegistration?: ServiceWorkerRegistration
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })

        window.swRegistration = registration

        // Verificar actualizaciones cada hora
        setInterval(() => {
          registration.update().catch(() => null)
        }, 60 * 60 * 1000)

        // Verificación inicial después de 5 segundos
        setTimeout(() => {
          registration.update().catch(() => null)
        }, 5000)
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }

    registerServiceWorker()
  }, [])

  return null
}
