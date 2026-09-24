"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { trackVersionEvent } from "@/lib/analytics/version-tracker"

const CHECK_INTERVAL_MS = 30_000

async function clearCachesAndReload() {
  try {
    if ("caches" in window) {
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))
    }
  } finally {
    window.location.reload()
  }
}

export function VersionManager() {
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const localVersionRef = useRef<string>("")
  const loadedAtRef = useRef<number>(0)
  const notifiedVersionRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    localVersionRef.current = document.querySelector('meta[name="app-version"]')?.getAttribute("content") || ""
    loadedAtRef.current = Date.now()
    trackVersionEvent("VERSION_DETECTED", { version: localVersionRef.current })

    const showUpdateNotification = (newVersion: string) => {
      if (notifiedVersionRef.current === newVersion) return
      notifiedVersionRef.current = newVersion

      toast.warning(`Versión ${newVersion} disponible`, {
        description: "Recarga para actualizar",
        duration: Infinity,
        action: {
          label: "Actualizar",
          onClick: () => {
            trackVersionEvent("UPDATE_CLICKED", { version: newVersion, oldVersion: localVersionRef.current })
            void clearCachesAndReload()
          },
        },
      })

      if ("serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification("SapoFit actualización", {
              body: `Nueva versión ${newVersion} disponible. Toca para actualizar.`,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              tag: "sapofit-update",
              data: { url: "/" },
            }),
          )
          .catch(() => undefined)
      }
    }

    try {
      broadcastRef.current = new BroadcastChannel("sapofit-version")
      broadcastRef.current.onmessage = (event) => {
        if (event.data?.type === "UPDATE_AVAILABLE" && event.data.newVersion) showUpdateNotification(event.data.newVersion)
        if (event.data?.type === "FORCE_UPDATE") void clearCachesAndReload()
      }
    } catch {
      broadcastRef.current = null
    }

    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" })
        if (!res.ok) return
        const data: { version?: string; forceUpdateAt?: string | null } = await res.json()

        if (data.forceUpdateAt) {
          const forcedAt = Date.parse(data.forceUpdateAt)
          if (!Number.isNaN(forcedAt) && forcedAt > loadedAtRef.current) {
            trackVersionEvent("FORCE_UPDATE_APPLIED", { version: data.version, oldVersion: localVersionRef.current })
            broadcastRef.current?.postMessage({ type: "FORCE_UPDATE" })
            void clearCachesAndReload()
            return
          }
        }

        if (data.version && localVersionRef.current && data.version !== localVersionRef.current) {
          trackVersionEvent("UPDATE_AVAILABLE", { version: data.version, oldVersion: localVersionRef.current })
          broadcastRef.current?.postMessage({ type: "UPDATE_AVAILABLE", newVersion: data.version })
          showUpdateNotification(data.version)
          navigator.serviceWorker?.getRegistration().then((reg) => reg?.update().catch(() => undefined))
        }
      } catch {
        // sin red: se reintenta en el siguiente ciclo
      }
    }

    void checkVersion()
    const interval = window.setInterval(checkVersion, CHECK_INTERVAL_MS)
    const onFocus = () => void checkVersion()
    window.addEventListener("focus", onFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      broadcastRef.current?.close()
    }
  }, [])

  return null
}
