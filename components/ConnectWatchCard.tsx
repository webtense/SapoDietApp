"use client"

import { useEffect, useState } from "react"
import { Watch, Copy, Trash2, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface HealthToken {
  id: string
  label: string
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

export default function ConnectWatchCard() {
  const [tokens, setTokens] = useState<HealthToken[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState("Mi iPhone")
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/user/health/tokens").then((r) => r.json()).catch(() => ({ tokens: [] }))
    setTokens((res.tokens ?? []).filter((t: HealthToken) => !t.revokedAt))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function generateToken() {
    if (!label.trim()) return
    setCreating(true)
    const res = await fetch("/api/user/health/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setNewToken(data.token)
      await load()
    }
    setCreating(false)
  }

  async function revoke(id: string) {
    await fetch(`/api/user/health/tokens/${id}`, { method: "DELETE" })
    await load()
  }

  async function copyToken() {
    if (!newToken) return
    try {
      await navigator.clipboard.writeText(newToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard puede fallar en contextos no seguros; el token sigue visible para copiar a mano
    }
  }

  const activeToken = tokens[0]

  return (
    <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Watch className="h-4 w-4" /> Conectar reloj
        </CardTitle>
        <CardDescription>
          Trae tus pasos, pulso y sueño desde Apple Salud con un Atajo de iOS. Ningún dato se envía sin tu token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {newToken ? (
          <div className="space-y-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">
              Copia este token ahora: no volverá a mostrarse.
            </p>
            <div className="flex gap-2">
              <Input readOnly value={newToken} className="font-mono text-xs" />
              <Button type="button" size="sm" variant="outline" onClick={copyToken}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => setNewToken(null)}>
              Ya lo he guardado
            </Button>
          </div>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : tokens.length === 0 ? (
          <div className="flex gap-2">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Etiqueta (ej. iPhone de Andrés)" />
            <Button type="button" onClick={generateToken} disabled={creating}>
              Generar token
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-2xl border p-3">
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.lastUsedAt
                      ? `Última sincronización: ${new Date(t.lastUsedAt).toLocaleString("es-ES")}`
                      : "Aún sin sincronizar"}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => revoke(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeToken && !newToken && (
          <Badge variant="secondary" className="w-fit">Reloj conectado</Badge>
        )}

        <div className="rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Guía del Atajo de iOS</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Abre la app Atajos → crea un atajo nuevo.</li>
            <li>Añade "Buscar muestras de salud" (pasos, pulso en reposo, sueño) de hoy.</li>
            <li>
              Añade "Obtener contenido de URL": método POST a{" "}
              <code className="rounded bg-background px-1">https://sapofit.semillasdeti.com/api/import/health</code>,
              cabecera <code className="rounded bg-background px-1">Authorization: Bearer &lt;tu token&gt;</code> y
              cuerpo JSON con los campos obtenidos (<code className="rounded bg-background px-1">date</code>,{" "}
              <code className="rounded bg-background px-1">steps</code>,{" "}
              <code className="rounded bg-background px-1">restingHr</code>,{" "}
              <code className="rounded bg-background px-1">sleepMin</code>…).
            </li>
            <li>Crea una automatización diaria que ejecute el atajo (hay que hacerlo una vez por iPhone).</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
