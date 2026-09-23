"use client"

import { useEffect, useState } from "react"

interface VersionData {
  version: string
  buildTime: string
  timestamp: number
}

export function VersionChecker() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [newVersion, setNewVersion] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Leer versión actual desde localStorage o sessionStorage
    const storedVersion = sessionStorage.getItem("app_version")

    // Verificar versión en el servidor cada 30 segundos
    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        })

        if (!res.ok) return

        const data: VersionData = await res.json()

        if (!storedVersion) {
          // Primera carga, guardar versión actual
          sessionStorage.setItem("app_version", data.version)
          setCurrentVersion(data.version)
        } else if (storedVersion !== data.version) {
          // Nueva versión disponible
          setNewVersion(data.version)
          setCurrentVersion(storedVersion)
          setShowUpdate(true)

          // Auto-reload después de 5 segundos si el usuario no interactúa
          const autoReloadTimer = setTimeout(() => {
            if (showUpdate) {
              handleUpdate()
            }
          }, 5000)

          return () => clearTimeout(autoReloadTimer)
        }
      } catch (error) {
        console.error("Error checking version:", error)
      }
    }

    // Check inicial inmediato
    checkVersion()

    // Check periódico cada 30 segundos
    const interval = setInterval(checkVersion, 30000)

    return () => clearInterval(interval)
  }, [showUpdate])

  const handleUpdate = () => {
    // Limpiar cache del service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister())
      })
    }

    // Limpiar localStorage de cache
    sessionStorage.removeItem("app_version")

    // Forzar reload completo (hard refresh)
    window.location.reload()
  }

  if (!showUpdate) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-blue-50 border-t-2 border-blue-500 p-4">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-blue-900">Nueva versión disponible</p>
          <p className="text-sm text-blue-700">
            {currentVersion} → {newVersion}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Actualizar ahora
          </button>
          <button
            onClick={() => setShowUpdate(false)}
            className="px-4 py-2 bg-blue-100 text-blue-900 rounded-lg font-medium hover:bg-blue-200 transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}
