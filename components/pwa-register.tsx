"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // Siempre verifica si hay actualizaciones
        })

        // Verificar actualizaciones cada 1 hora
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
