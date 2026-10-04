"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Calendar, Activity, Zap } from "lucide-react"

interface DashboardStats {
  totalUsers: number
  activeToday: number
  newToday: number
  completionRate: number
  systemHealth: { status: 'ok' | 'warning' | 'error'; message: string }
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (e) {
        console.error('Dashboard error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !stats) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-green-600">+{stats.newToday} hoy</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeToday}</div>
          <p className="text-xs text-blue-600">Hoy</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Compleción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completionRate}%</div>
          <p className="text-xs text-purple-600">Perfiles</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={stats.systemHealth.status === 'ok' ? 'default' : 'destructive'}>
            {stats.systemHealth.status.toUpperCase()}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">{stats.systemHealth.message}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">✓</div>
          <p className="text-xs text-green-600">Sync 24/7</p>
        </CardContent>
      </Card>
    </div>
  )
}
