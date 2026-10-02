'use client'
import { useEffect } from 'react'

export default function VersionCheck() {
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
          const reload = confirm('🔄 Nueva actualización disponible. ¿Recargar ahora?')
          if (reload) {
            window.location.reload()
          }
        }
        lastVersion = data.version
      } catch (error) {
        console.debug('Version check failed:', error)
      } finally {
        isChecking = false
      }
    }

    checkVersion()
    const interval = setInterval(checkVersion, 30000)

    return () => clearInterval(interval)
  }, [])

  return null
}
