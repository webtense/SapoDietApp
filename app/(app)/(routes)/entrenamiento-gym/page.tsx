"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MaquinasSection } from "@/components/gym/maquinas-section"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function EntrenamientoGymPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    const initSession = async () => {
      try {
        const res = await fetch("/api/user/workout/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        })

        if (res.ok) {
          const data = await res.json()
          setSessionId(data.sessionId || data.id)
        }
      } catch (err) {
        console.error("Error initializing session:", err)
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [session, router])

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6">
          <p>Accediendo...</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Entrenamiento · Máquinas Gimnasio</h1>
        <p className="mt-2 text-gray-600">Selecciona tren superior o inferior para ver tus máquinas</p>
      </div>

      {sessionId ? (
        <MaquinasSection sessionId={sessionId} />
      ) : (
        <Card className="p-6 text-center text-red-600">
          Error: No se pudo inicializar la sesión de entrenamiento
        </Card>
      )}
    </div>
  )
}
