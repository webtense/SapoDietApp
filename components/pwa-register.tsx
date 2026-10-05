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
        const interval = setInterval(() => {
          registration.update().catch(() => null)
        }, 60 * 60 * 1000)

        // Verificación inicial después de 5 segundos
        setTimeout(() => {
          registration.update().catch(() => null)
        }, 5000)

        // iOS (y Safari en general) congela los timers de una PWA en segundo
        // plano: forzar comprobación al volver a primer plano.
        const checkOnForeground = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => null)
          }
        }
        document.addEventListener("visibilitychange", checkOnForeground)
        window.addEventListener("focus", checkOnForeground)

        return () => {
          clearInterval(interval)
          document.removeEventListener("visibilitychange", checkOnForeground)
          window.removeEventListener("focus", checkOnForeground)
        }
      } catch (error) {
        console.error("Service Worker registration failed:", error)
        return undefined
      }
    }

    let cleanup: (() => void) | undefined
    registerServiceWorker().then((fn) => {
      cleanup = fn
    })

    return () => {
      cleanup?.()
    }
  }, [])

  return null
}
