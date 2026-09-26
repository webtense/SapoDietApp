export const revalidate = 3600 // Cache 1 hora

const CHANGELOG = {
  entries: [
    {
      version: "3.9.0",
      date: "26/09/2026",
      features: [
        "Gimnasios multiusuario: cualquiera puede crear su gimnasio, verlo el resto y activar el suyo en /gimnasios; /entrenamiento muestra todas las máquinas del gimnasio activo por Tren Superior/Inferior",
        "Calendario semanal de entreno (/calendario-entreno): asigna un grupo muscular a cada día y recibe un push motivacional (\"¡HOY: DÍA DE PIERNAS!\") a la hora de tu recordatorio",
        "Módulo de nutrición completado y conectado: importar plan de nutricionista, comensales del hogar, comida fuera de casa, lista de la compra automática y sustituciones de ingredientes"
      ],
      fixes: [
        "El recordatorio de entreno nunca se disparaba: no había ningún cron llamando al endpoint de envío. Añadido en el VPS y verificado en vivo",
        "saveNutritionistPlan violaba la restricción de una fila por usuario en cuanto se guardaba un segundo plan",
        "La página de nutrición seguía usando el sistema antiguo (/api/plan) sin conectar con el nuevo módulo, que llevaba desde septiembre sin usarse"
      ]
    },
    {
      version: "3.8.0",
      date: "26/09/2026",
      features: [
        "Base de datos para gimnasios multiusuario (cualquiera puede crear su gimnasio) y calendario semanal de entreno con push motivacional"
      ],
      fixes: [
        "Drift de esquema: Profile.gymId y Profile.onboardingCompletedAt existían en producción pero no en el schema del repo (riesgo de build roto). Restaurados y formalizados con relación e índice",
        "Columna huérfana User.subscriptionstatus (minúsculas, sin relación con el subscriptionStatus real) eliminada"
      ]
    },
    {
      version: "3.7.7",
      date: "26/09/2026",
      features: [],
      fixes: [
        "El Service Worker servía para siempre el HTML de la primera visita en /inicio, /entrenamiento, etc.; tras cada actualización la app se quedaba sin estilos y en \"Cargando…\". Ahora las páginas siempre van a red y las pestañas abiertas se recargan solas al activarse una versión nueva"
      ]
    },
    {
      version: "3.7.6",
      date: "25/09/2026",
      features: [
        "Catálogo de máquinas de Planet Fitness (7 máquinas reales) visible en /entrenamiento y /admin/machines",
        "Historial de series del 23/09 recuperado (prensa, curl y extensión de piernas)",
        "Despliegue automático a producción desde GitHub Actions tras CI verde"
      ],
      fixes: [
        "El menú lateral mostraba siempre v3.7.0: ahora lee la versión real",
        "CI en rojo desde abril por migraciones duplicadas de postalCode: ahora son idempotentes",
        "Eliminadas tablas de base de datos duplicadas (fusión SAPOGYM) que dejaban el listado de máquinas vacío",
        "Seed de gimnasio roto contra el esquema actual",
        "La gráfica de evolución por máquina devolvía error 500",
        "La pantalla de entrenamiento se quedaba en blanco (\"This page couldn't load\")"
      ]
    },
    {
      version: "3.7.5",
      date: "24/09/2026",
      features: [
        "Aviso para instalar SapoFit como app (PWA) en móvil y escritorio",
        "Cache-busting de manifest e iconos por build",
        "Panel de administración de versiones en /admin/version",
        "Forzar actualización en todos los dispositivos conectados",
        "Actualizaciones programadas a una hora concreta",
        "Feature flags activables desde el panel admin",
        "Métricas de adopción de versión y uso del changelog",
        "Tests E2E del sistema de versiones (Playwright)"
      ],
      fixes: [
        "La versión mostrada en el footer y en /api/version sale de una única fuente",
        "Service Worker limpia caches de versiones anteriores al activarse"
      ]
    },
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
