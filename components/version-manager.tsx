"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function VersionManager() {
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const appVersionRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Obtener versión actual del meta tag
    const versionMeta = document.querySelector('meta[name="app-version"]')
    appVersionRef.current = versionMeta?.getAttribute("content") || "3.7.0"

    // Setup BroadcastChannel para comunicación entre tabs
    try {
      broadcastRef.current = new BroadcastChannel("sapofit-version")
      broadcastRef.current.onmessage = (event) => {
        const { type, newVersion } = event.data

        if (type === "UPDATE_AVAILABLE") {
          toast.warning(`Versión ${newVersion} disponible`, {
            description: "Recarga para actualizar a la última versión",
            action: {
              label: "Recargar ahora",
              onClick: () => {
                // Limpiar caches antes de recargar
                if ("caches" in window) {
                  caches.keys().then((names) => {
                    Promise.all(names.map((name) => caches.delete(name))).then(() => {
                      window.location.reload()
                    })
                  })
                } else {
                  window.location.reload()
                }
              },
            },
            duration: 0, // No auto-close
          })
        }
      }
    } catch (e) {
      console.warn("BroadcastChannel not available:", e)
    }

    // Función para chequear nueva versión
    const checkVersion = async () => {
      try {
        const response = await fetch("/api/version", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })

        if (!response.ok) return

        const data = await response.json()
        const serverVersion = data.version
        const localVersion = appVersionRef.current

        if (serverVersion && localVersion && serverVersion !== localVersion) {
          console.log(`🔄 Nueva versión disponible: ${serverVersion} (local: ${localVersion})`)

          // Notificar a otros tabs
          if (broadcastRef.current) {
            broadcastRef.current.postMessage({
              type: "UPDATE_AVAILABLE",
              oldVersion: localVersion,
              newVersion: serverVersion,
            })
          }

          // Mostrar toast en este tab
          toast.warning(`Versión ${serverVersion} disponible`, {
            description: "Recarga para actualizar",
            action: {
              label: "Actualizar",
              onClick: () => {
                if ("caches" in window) {
                  caches.keys().then((names) => {
                    Promise.all(names.map((name) => caches.delete(name))).then(() => {
                      window.location.reload()
                    })
                  })
                } else {
                  window.location.reload()
                }
              },
            },
            duration: 0,
          })

          // Service Worker: forzar skip waiting
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              const newWorker = reg.installing || reg.waiting
              if (newWorker) {
                newWorker.postMessage({ type: "SKIP_WAITING" })
              }
            })
          }
        }
      } catch (err) {
        console.error("Error checking version:", err)
      }
    }

    // Check inmediatamente
    checkVersion()

    // Check cada 30 segundos
    checkTimeoutRef.current = setInterval(checkVersion, 30000)

    // También chequear cuando la ventana entra en foco
    const handleFocus = () => {
      console.log("🔍 Tab en foco, chequeando versión...")
      checkVersion()
    }

    window.addEventListener("focus", handleFocus)

    // Cleanup
    return () => {
      if (checkTimeoutRef.current) clearInterval(checkTimeoutRef.current)
      window.removeEventListener("focus", handleFocus)
      if (broadcastRef.current) broadcastRef.current.close()
    }
  }, [])

  return null // Sin UI visual, solo notificaciones
}
