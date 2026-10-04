"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AuditLog {
  id: string
  createdAt: string
  method: string
  path: string
  status: number
  details: Record<string, any> | null
  user: { name: string | null; email: string } | null
}

const PAGE_SIZE = 50

function statusVariant(status: number): "default" | "secondary" | "destructive" | "outline" {
  if (status >= 200 && status < 300) return "default"
  if (status >= 300 && status < 400) return "secondary"
  if (status >= 400 && status < 500) return "destructive"
  return "outline"
}

function statusClasses(status: number): string {
  if (status >= 200 && status < 300) return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
  if (status >= 300 && status < 400) return "bg-blue-100 text-blue-800 hover:bg-blue-100"
  if (status >= 400 && status < 500) return "bg-red-100 text-red-800 hover:bg-red-100"
  return "bg-neutral-900 text-white hover:bg-neutral-900"
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [methodFilter, setMethodFilter] = useState("")
  const [pathFilter, setPathFilter] = useState("")

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total])
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })
      if (methodFilter) params.set("method", methodFilter)
      if (pathFilter) params.set("path", pathFilter)

      const response = await fetch(`/api/admin/audit?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Error cargando auditoría:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset])

  const applyFilters = () => {
    setOffset(0)
    fetchLogs()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Auditoría de administración</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registro de solicitudes de escritura realizadas desde el panel de administración.
            Solo lectura.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Método</label>
              <Input
                placeholder="POST, PATCH..."
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value.toUpperCase())}
                className="h-9 w-32"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Ruta</label>
              <Input
                placeholder="/api/admin/users"
                value={pathFilter}
                onChange={(e) => setPathFilter(e.target.value)}
                className="h-9 w-56"
              />
            </div>
            <Button size="sm" onClick={applyFilters} disabled={loading}>
              Filtrar
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Método</th>
                  <th className="px-3 py-2">Ruta</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      No hay registros de auditoría.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("es-ES")}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{log.method}</td>
                    <td className="px-3 py-2 font-mono text-xs">{log.path}</td>
                    <td className="px-3 py-2">
                      <Badge variant={statusVariant(log.status)} className={statusClasses(log.status)}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {log.user ? log.user.name || log.user.email : "—"}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 text-xs text-muted-foreground">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {currentPage} de {totalPages} · {total} registros
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={offset + PAGE_SIZE >= total || loading}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
