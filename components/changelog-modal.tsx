"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ChangelogEntry {
  version: string
  date: string
  features: string[]
  fixes: string[]
  breaking?: string[]
}

interface ChangelogModalProps {
  isOpen: boolean
  onClose: () => void
  currentVersion: string
}

export function ChangelogModal({ isOpen, onClose, currentVersion }: ChangelogModalProps) {
  const [expandedVersion, setExpandedVersion] = useState<string>(currentVersion)
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchChangelog()
    }
  }, [isOpen])

  const fetchChangelog = async () => {
    try {
      const res = await fetch("/api/changelog", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      })
      if (res.ok) {
        const data = await res.json()
        setChangelog(data.entries || [])
      }
    } catch (err) {
      console.error("Error fetching changelog:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
        <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Changelog</h2>
            <p className="text-sm text-gray-600 mt-1">Historial de actualizaciones</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">Cargando changelog...</p>
            </div>
          ) : changelog.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">No hay changelog disponible</p>
            </div>
          ) : (
            changelog.map((entry) => (
              <div key={entry.version}>
                <button
                  onClick={() =>
                    setExpandedVersion(
                      expandedVersion === entry.version ? "" : entry.version
                    )
                  }
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg transition text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      entry.version === currentVersion
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      v{entry.version}
                    </div>
                    <span className="text-sm text-gray-600">{entry.date}</span>
                  </div>
                  {expandedVersion === entry.version ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {expandedVersion === entry.version && (
                  <div className="pl-6 pr-3 pb-3 space-y-3 border-l-2 border-emerald-200">
                    {entry.features.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-emerald-700 mb-2">✨ Nuevas características</h4>
                        <ul className="space-y-1">
                          {entry.features.map((feature, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-emerald-500 mt-1">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.fixes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-700 mb-2">🔧 Correcciones</h4>
                        <ul className="space-y-1">
                          {entry.fixes.map((fix, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.breaking && entry.breaking.length > 0 && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <h4 className="text-sm font-semibold text-red-700 mb-2">⚠️ Cambios incompatibles</h4>
                        <ul className="space-y-1">
                          {entry.breaking.map((breaking, i) => (
                            <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{breaking}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 flex justify-end bg-gray-50">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </Card>
    </div>
  )
}
