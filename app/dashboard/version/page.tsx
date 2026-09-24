'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface VersionData {
  flags: Array<{ name: string; enabled: boolean }>
  versionHistory: Array<{ version: string; deployedAt: string; usersOnVersion: number }>
  scheduledUpdates: Array<{ id: string; version: string; scheduledFor: string; status: string }>
}

export default function VersionDashboard() {
  const [data, setData] = useState<VersionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/version/control', {
        headers: {
          'x-user-role': 'ADMIN',
        },
      })
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (action: string, payload: any = {}) => {
    try {
      const res = await fetch('/api/admin/version/control', {
        method: 'POST',
        headers: {
          'x-user-role': 'ADMIN',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...payload }),
      })
      if (res.ok) {
        toast.success(`${action} executed`)
        await fetchData()
      } else {
        toast.error('Action failed')
      }
    } catch (error) {
      toast.error('Error executing action')
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📊 Version Deployment Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deployment Controls */}
        <Card>
          <CardHeader>
            <CardTitle>🎛️ Deployment Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => executeAction('FORCE_UPDATE', { version: '3.7.5' })}
              className="w-full bg-red-600"
            >
              Force Update All
            </Button>
            <Button
              onClick={() => executeAction('ROLLBACK', { version: '3.7.3' })}
              className="w-full bg-orange-600"
            >
              Rollback to v3.7.3
            </Button>
            <Button
              onClick={() => executeAction('SCHEDULE_UPDATE', { version: '3.7.6', scheduledTime: new Date(Date.now() + 3600000).toISOString() })}
              className="w-full"
            >
              Schedule Update (1h)
            </Button>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.flags.map((flag) => (
              <div key={flag.name} className="flex justify-between items-center">
                <span>{flag.name}</span>
                <Button
                  size="sm"
                  variant={flag.enabled ? 'default' : 'outline'}
                  onClick={() => executeAction('TOGGLE_FLAG', { flagName: flag.name, enabled: !flag.enabled })}
                >
                  {flag.enabled ? 'ON' : 'OFF'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Version History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>📋 Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Version</th>
                  <th className="text-left">Deployed</th>
                  <th className="text-right">Users</th>
                </tr>
              </thead>
              <tbody>
                {data?.versionHistory.map((v) => (
                  <tr key={v.version} className="border-b">
                    <td className="py-2 font-mono">{v.version}</td>
                    <td>{new Date(v.deployedAt).toLocaleString()}</td>
                    <td className="text-right">{v.usersOnVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Scheduled Updates */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>⏰ Scheduled Updates</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.scheduledUpdates.length === 0 ? (
              <p className="text-gray-500">No updates scheduled</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Version</th>
                    <th className="text-left">Scheduled For</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.scheduledUpdates.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2 font-mono">{u.version}</td>
                      <td>{new Date(u.scheduledFor).toLocaleString()}</td>
                      <td>{u.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
