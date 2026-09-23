"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface ChangelogEntry {
  version: string
  date: string
  type: "feature" | "bugfix" | "internal"
  items: string[]
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "3.6.0",
    date: "Septiembre 23, 2026",
    type: "feature",
    items: [
      "Módulo de Máquinas de Gimnasio COMPLETO — admin + UI usuario + runtime APIs",
      "Admin panel (/admin/machines) crear/editar máquinas, asignar a gimnasio",
      "Selector dinámico de Grupo Muscular (Tren Superior / Tren Inferior)",
      "Entrada de pesos por serie (3 inputs, 3 series × 12 reps)",
      "Modal información máquinas (descripción, instrucciones, recomendaciones)",
      "Rutas runtime: GET /api/user/workout/current, POST exercise/*/set, POST workout/end",
      "Componente MaquinasSection (reutilizable)",
      "Migración Prisma 20260923_add_machine_models aplicada",
    ],
  },
  {
    version: "3.5.0",
    date: "Septiembre 2026",
    type: "internal",
    items: [
      "⚠️ CORRECCIÓN HISTÓRICA: esta versión claims módulo de máquinas 'completo' pero solo tiene backend CRUD",
      "Modelos Prisma: Gym, MachineModel, GymMachine",
      "Rutas admin CRUD: /api/admin/machines",
      "Módulo completado realmente en v3.6.0",
    ],
  },
  {
    version: "3.4.1",
    date: "Septiembre 23, 2026",
    type: "bugfix",
    items: [
      "Admin logout roto — botón logout en /admin/layout",
      "DELETE usuario HTTP 500 — arreglado params async en Route Handlers",
      "Redireccionamiento admin sin bucle",
    ],
  },
  {
    version: "3.4.0",
    date: "Abril 2026",
    type: "feature",
    items: [
      "Edición de series registradas mediante upsert",
      "Progresión de ejercicios con gráfica Recharts (1RM Epley)",
      "Selector dinámico de gimnasio en onboarding",
      "Catálogo Planet Fitness con máquinas reales",
      "Sistema de Planes A/B/C con rotación automática",
      "Next.js 16 + Prisma 7.10 + @prisma/adapter-pg",
    ],
  },
]

export function ChangelogModal() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Ver changelog (v3.6.0)"
        className="fixed bottom-4 right-4 text-xs text-gray-500 hover:text-gray-700 cursor-help"
      >
        v3.5.0
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Changelog — SapoFit</h2>
            <p className="text-sm text-gray-600">Historial de versiones y cambios</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="border-l-4 border-green-500 pl-4">
              <div className="flex items-baseline gap-3 mb-2">
                <h3 className="font-bold text-lg">{entry.version}</h3>
                <span className="text-sm text-gray-500">{entry.date}</span>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    entry.type === "feature"
                      ? "bg-green-100 text-green-800"
                      : entry.type === "bugfix"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {entry.type === "feature"
                    ? "✨ Features"
                    : entry.type === "bugfix"
                      ? "🐛 Fixes"
                      : "📝 Internal"}
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {entry.items.map((item, idx) => (
                  <li key={idx} className="text-gray-700 flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 text-sm text-gray-600">
          <p>
            Versión actual: <strong>3.5.0</strong> — Doble-click en el logo o haz clic en la versión para volver a abrir
          </p>
        </div>
      </div>
    </div>
  )
}
