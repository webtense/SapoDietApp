'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function VersionCheck() {
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  useEffect(() => {
    let lastVersion: string | null = null
    let isChecking = false

    const checkVersion = async () => {
      if (isChecking) return
      isChecking = true

      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        const data = await res.json()

        if (lastVersion && lastVersion !== data.version) {
          setShowUpdateModal(true)
        }
        lastVersion = data.version
      } catch (error) {
        console.debug('Version check failed:', error)
      } finally {
        isChecking = false
      }
    }

    checkVersion()
    const interval = setInterval(checkVersion, 10000) // Chequea cada 10 seg

    return () => clearInterval(interval)
  }, [])

  if (!showUpdateModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">🔄 Nueva versión disponible</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se ha descargado una actualización. Recarga para obtener las mejoras más recientes.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowUpdateModal(false)}
            >
              Después
            </Button>
            <Button
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              Recargar ahora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
