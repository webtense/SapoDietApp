"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BackupLog {
  id: string
  status: "RUNNING" | "SUCCESS" | "FAILED"
  triggeredBy: "MANUAL" | "CRON"
  filename: string | null
  sizeBytes: number | null
  error: string | null
  startedAt: string
  finishedAt: string | null
}

function formatSize(bytes: number | null) {
  if (!bytes) return "-"
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  SUCCESS: "default",
  RUNNING: "secondary",
  FAILED: "destructive",
}

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<BackupLog[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/backups").then(r => r.json()).catch(() => ({ backups: [] }))
    setBackups(res.backups ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function backupManual() {
    setRunning(true)
    await fetch("/api/admin/backups/manual", { method: "POST" })
    setRunning(false)
    load()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Backups</h1>
        <Button onClick={backupManual} disabled={running}>
          {running ? "Ejecutando..." : "Backup manual ahora"}
        </Button>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {backups.map(b => (
          <Card key={b.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{b.filename ?? "(sin fichero)"}</p>
                <p className="text-sm text-muted-foreground">
                  {b.triggeredBy} · {formatSize(b.sizeBytes)} · {new Date(b.startedAt).toLocaleString("es-ES")}
                </p>
                {b.error && <p className="text-sm text-red-600">{b.error}</p>}
              </div>
              <Badge variant={STATUS_VARIANT[b.status] ?? "secondary"}>{b.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
