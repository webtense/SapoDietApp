"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export function VersionManager({
  onChangelogOpen,
}: {
  onChangelogOpen?: () => void
} = {}) {
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const appVersionRef = useRef<string | null>(null)
  const [, setIsOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const versionMeta = document.querySelector('meta[name="app-version"]')
    appVersionRef.current = versionMeta?.getAttribute("content") || "3.7.0"

    try {
      broadcastRef.current = new BroadcastChannel("sapofit-version")
      broadcastRef.current.onmessage = (event) => {
        const { type, newVersion } = event.data

        if (type === "UPDATE_AVAILABLE") {
          showUpdateNotification(newVersion)
        }
      }
    } catch (e) {
      console.warn("BroadcastChannel not available:", e)
    }

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

          if (broadcastRef.current) {
            broadcastRef.current.postMessage({
              type: "UPDATE_AVAILABLE",
              oldVersion: localVersion,
              newVersion: serverVersion,
            })
          }

          showUpdateNotification(serverVersion)

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

    const showUpdateNotification = (newVersion: string) => {
      // Toast
      toast.warning(`Versión ${newVersion} disponible`, {
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

      // Push Notification
      if ("serviceWorker" in navigator && "Notification" in window) {
        navigator.serviceWorker.ready.then((reg) => {
          // Pedir permiso si es necesario
          if (Notification.permission === "granted") {
            reg.showNotification("SapoFit Actualización", {
              body: `Nueva versión ${newVersion} disponible. Click para actualizar.`,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              tag: "sapofit-update",
              requireInteraction: true,
              data: { url: "/" },
            })
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
              if (permission === "granted") {
                reg.showNotification("SapoFit Actualización", {
                  body: `Nueva versión ${newVersion} disponible. Click para actualizar.`,
                  icon: "/icon-192.png",
                  badge: "/icon-192.png",
                  tag: "sapofit-update",
                  requireInteraction: true,
                  data: { url: "/" },
                })
              }
            })
          }
        })
      }
    }

    checkVersion()
    checkTimeoutRef.current = setInterval(checkVersion, 30000)

    const handleFocus = () => {
      console.log("🔍 Tab en foco, chequeando versión...")
      checkVersion()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      if (checkTimeoutRef.current) clearInterval(checkTimeoutRef.current)
      window.removeEventListener("focus", handleFocus)
      if (broadcastRef.current) broadcastRef.current.close()
    }
  }, [])

  return null
}
