'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

interface StatusApparatus {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  lastCheck: string
}

interface StatusResponse {
  checkedAt: string
  version: {
    version: string
    buildId: string
    timestamp: string
  }
  summary: {
    ok: number
    warning: number
    error: number
  }
  apparatuses: StatusApparatus[]
}

export default function AdminStatusPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/status', {
        headers: {
          'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_STATUS_TOKEN || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Refrescar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Estado del Sistema</h1>
        <p className="text-gray-600">Monitorización de aparatos y servicios en tiempo real</p>
      </div>

      {/* Version Card */}
      {status?.version && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Información de Versión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Versión App</p>
                <p className="text-lg font-semibold text-gray-900">{status.version.version}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Build ID</p>
                <p className="text-lg font-semibold text-gray-900">{status.version.buildId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deployed</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(status.version.timestamp).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      {status?.summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-700">{status.summary.ok}</p>
                <p className="text-sm text-green-600 mt-1">Operativo</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-700">{status.summary.warning}</p>
                <p className="text-sm text-yellow-600 mt-1">Aviso</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-700">{status.summary.error}</p>
                <p className="text-sm text-red-600 mt-1">Error</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Apparatuses */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Aparatos y Servicios</h2>
        {status?.apparatuses ? (
          <div className="grid gap-3">
            {status.apparatuses.map((apparatus, idx) => (
              <Card
                key={idx}
                className={`border-2 ${getStatusColor(apparatus.status)}`}
              >
                <CardContent className="pt-4 flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{getStatusIcon(apparatus.status)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{apparatus.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{apparatus.message}</p>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(apparatus.lastCheck).toLocaleTimeString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      apparatus.status === 'ok'
                        ? 'default'
                        : apparatus.status === 'warning'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="ml-2"
                  >
                    {apparatus.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando aparatos...</p>
          </div>
        ) : null}
      </div>

      {/* Last Refresh */}
      {lastRefresh && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            Última actualización:{' '}
            <span className="font-semibold">
              {lastRefresh.toLocaleTimeString('es-ES')}
            </span>
          </p>
          <Button
            onClick={fetchStatus}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Actualizando...' : 'Actualizar ahora'}
          </Button>
        </div>
      )}
    </div>
  )
}
