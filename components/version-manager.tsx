"use client"

import { useEffect, useRef, useState } from "react"
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
  const localBuildIdRef = useRef<string>("")
  const loadedAtRef = useRef<number>(0)
  const notifiedBuildIdRef = useRef<string | null>(null)
  const reloadingRef = useRef(false)
  const [pendingVersion, setPendingVersion] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    localVersionRef.current = document.querySelector('meta[name="app-version"]')?.getAttribute("content") || ""
    localBuildIdRef.current = document.querySelector('meta[name="build-commit"]')?.getAttribute("content") || ""
    loadedAtRef.current = Date.now()
    trackVersionEvent("VERSION_DETECTED", { version: localVersionRef.current })

    // Cuando el SW en espera toma el control, recargamos una sola vez.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadingRef.current) return
        reloadingRef.current = true
        window.location.reload()
      })
    }

    const showUpdateBanner = (newVersion: string, newBuildId: string) => {
      if (notifiedBuildIdRef.current === newBuildId) return
      notifiedBuildIdRef.current = newBuildId
      setPendingVersion(newVersion)

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
        if (event.data?.type === "UPDATE_AVAILABLE" && event.data.newVersion) {
          showUpdateBanner(event.data.newVersion, event.data.newBuildId || event.data.newVersion)
        }
        if (event.data?.type === "FORCE_UPDATE") void clearCachesAndReload()
      }
    } catch {
      broadcastRef.current = null
    }

    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" })
        if (!res.ok) return
        const data: { version?: string; buildId?: string; forceUpdateAt?: string | null } = await res.json()

        if (data.forceUpdateAt) {
          const forcedAt = Date.parse(data.forceUpdateAt)
          if (!Number.isNaN(forcedAt) && forcedAt > loadedAtRef.current) {
            trackVersionEvent("FORCE_UPDATE_APPLIED", { version: data.version, oldVersion: localVersionRef.current })
            broadcastRef.current?.postMessage({ type: "FORCE_UPDATE" })
            void clearCachesAndReload()
            return
          }
        }

        const remoteBuildId = data.buildId || data.version || ""
        const hasNewBuild = Boolean(
          remoteBuildId && localBuildIdRef.current && remoteBuildId !== localBuildIdRef.current,
        )
        const hasNewVersion = Boolean(
          data.version && localVersionRef.current && data.version !== localVersionRef.current,
        )

        if (hasNewBuild || hasNewVersion) {
          trackVersionEvent("UPDATE_AVAILABLE", { version: data.version, oldVersion: localVersionRef.current })
          broadcastRef.current?.postMessage({
            type: "UPDATE_AVAILABLE",
            newVersion: data.version,
            newBuildId: remoteBuildId,
          })
          showUpdateBanner(data.version || remoteBuildId, remoteBuildId)
          navigator.serviceWorker?.getRegistration().then((reg) => reg?.update().catch(() => undefined))
        }
      } catch {
        // sin red: se reintenta en el siguiente ciclo
      }
    }

    void checkVersion()
    const interval = window.setInterval(checkVersion, CHECK_INTERVAL_MS)
    const onFocus = () => void checkVersion()
    const onVisibility = () => {
      if (document.visibilityState === "visible") void checkVersion()
    }
    window.addEventListener("focus", onFocus)
    window.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("visibilitychange", onVisibility)
      broadcastRef.current?.close()
    }
  }, [])

  const handleUpdateClick = () => {
    const version = pendingVersion
    trackVersionEvent("UPDATE_CLICKED", { version, oldVersion: localVersionRef.current })
    void (async () => {
      const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined)
      const waiting = registration?.waiting
      if (waiting) {
        waiting.postMessage({ type: "SKIP_WAITING" })
      } else {
        await registration?.update().catch(() => undefined)
        void clearCachesAndReload()
      }
    })()
  }

  if (!pendingVersion) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-[9999] flex items-center justify-between gap-3 bg-emerald-600 px-4 py-3 text-sm text-white shadow-[0_-2px_12px_rgba(0,0,0,0.15)]"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <span className="font-medium">
        Versión {pendingVersion} disponible
      </span>
      <button
        type="button"
        onClick={handleUpdateClick}
        className="shrink-0 rounded-md bg-white px-3 py-1.5 font-semibold text-emerald-700 active:scale-95"
      >
        Actualizar ahora
      </button>
    </div>
  )
}
