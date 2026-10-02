'use client'
import { useEffect } from 'react'

export default function WeeklyReminders() {
  useEffect(() => {
    // Registrar Web Push si no está activo
    const registerPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        // Si no hay suscripción, solicitar permiso
        if (!subscription && Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            console.log('✅ Web Push activado')
          }
        }
      } catch (error) {
        console.debug('Push registration failed:', error)
      }
    }

    registerPush()

    // Chequear si es lunes a las 09:00 para enviar notificación de peso
    const checkWeeklyReminder = () => {
      const now = new Date()
      const day = now.getDay() // 0=domingo, 1=lunes, ...
      const hours = now.getHours()
      const minutes = now.getMinutes()

      // Lunes (day=1) entre 09:00 y 09:01
      if (day === 1 && hours === 9 && minutes === 0) {
        if (Notification.permission === 'granted') {
          new Notification('⚖️ ¿Cuál es tu peso hoy?', {
            body: 'Regístralo en Hoy → Peso para seguir tu progreso',
            icon: '/icon-192.png',
            tag: 'weekly-weight',
            requireInteraction: false,
          })
        }
      }

      // Viernes a las 18:00 para resumen semanal
      if (day === 5 && hours === 18 && minutes === 0) {
        if (Notification.permission === 'granted') {
          new Notification('📊 ¿Cómo fue tu semana?', {
            body: 'Ve a Informes para ver tu resumen de entrenamientos',
            icon: '/icon-192.png',
            tag: 'weekly-summary',
            requireInteraction: false,
          })
        }
      }

      // Cada 2 semanas (lunes +1 semana) pedir fotos de progreso
      const weekNumber = Math.floor(now.getDate() / 7)
      if (day === 1 && weekNumber % 2 === 0 && hours === 10 && minutes === 0) {
        if (Notification.permission === 'granted') {
          new Notification('📸 ¡Toma una foto de progreso!', {
            body: 'Registra tu avance. Ve a Progreso → Fotos',
            icon: '/icon-192.png',
            tag: 'bi-weekly-photo',
            requireInteraction: false,
          })
        }
      }
    }

    // Chequear cada minuto
    const interval = setInterval(checkWeeklyReminder, 60000)
    checkWeeklyReminder() // Primera verificación inmediata

    return () => clearInterval(interval)
  }, [])

  return null
}
