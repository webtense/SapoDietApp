export const revalidate = 3600 // Cache 1 hora

const CHANGELOG = {
  entries: [
    {
      version: "3.7.0",
      date: "24/09/2026",
      features: [
        "Sistema automático de actualización cada 30 segundos",
        "Detección de versión nueva con notificaciones",
        "Service Worker con cache-busting por commit hash",
        "Multi-tab synchronization via BroadcastChannel",
        "Modal de changelog con historial de versiones",
        "Push notifications cuando hay update disponible",
        "Página /entrenamiento-gym con selector UPPER/LOWER",
        "Onboarding v2 rediseñado (4 pasos)",
        "Modo offline-first mejorado"
      ],
      fixes: [
        "Footer ahora muestra versión correcta (v3.7.0 · septiembre 2026)",
        "Eliminado error 404 en rutas nuevas",
        "Middleware permite /api/version sin autenticación",
        "Service Worker no cachea endpoints API",
        "Sincronización de caches entre pestañas"
      ]
    },
    {
      version: "3.6.0",
      date: "23/09/2026",
      features: [
        "Módulo de máquinas de gimnasio",
        "Selector de grupos musculares (UPPER/LOWER)",
        "Integración con sistema de entrenamientos"
      ],
      fixes: [
        "Mejorada estabilidad del módulo de máquinas"
      ]
    },
    {
      version: "3.5.1",
      date: "22/09/2026",
      features: [
        "Mejoras en UI/UX",
        "Optimización de rendimiento"
      ],
      fixes: [
        "Corregidos bugs menores en navegación"
      ]
    },
    {
      version: "3.4",
      date: "abril 2026",
      features: [
        "Versión inicial en producción",
        "Módulos: Nutrición, Entrenamiento, Hoy, Compra",
        "Tracking de peso y biometría",
        "Notificaciones push"
      ],
      fixes: []
    }
  ]
}

export async function GET() {
  return Response.json(CHANGELOG)
}
