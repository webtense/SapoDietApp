"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InvitationData {
  id: string
  email: string
  name?: string | null
  expiresAt: string
  status: string
  userId?: string | null
}

export function InvitationScreen({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Invitación no válida")
        }
        setInvitation(data.invitation)
        setName(data.invitation.name || "")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [token])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "No se pudo activar la cuenta")
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Validando invitación...</p>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invitación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 text-sm">{error || "Invitación no disponible"}</p>
            <Button className="mt-4" onClick={() => router.push("/login")}>Volver al inicio de sesión</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-muted/40">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Activa tu cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">Estamos listos para personalizar tu plan.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Email</Label>
              <Input value={invitation.email} disabled />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Nueva contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Guardando..." : "Crear contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
