export const revalidate = 3600 // Cache 1 hora

const CHANGELOG = {
  entries: [
    {
      version: "3.12.2",
      date: "26/09/2026",
      features: [],
      fixes: [
        "El plan \"alta en proteínas\" mostraba \"Este plan necesita revisión\" sin necesidad: el contenido viene literal del documento aportado, solo un par de puntos menores quedan como nota informativa (rotación de fiambre, merienda libre) en vez de bloquear con la alerta"
      ]
    },
    {
      version: "3.12.1",
      date: "26/09/2026",
      features: [],
      fixes: [
        "El onboarding V4 rechazaba el envío en el último paso para cualquier usuario cuyo perfil ya tuviera el sexo guardado (\"hombre\"/\"mujer\", el formato real usado en toda la app): el wizard asumía un enum \"M\"/\"F\" que nunca se había usado en producción"
      ]
    },
    {
      version: "3.12.0",
      date: "26/09/2026",
      features: [
        "Onboarding V4: wizard de 8 pasos con medidas corporales, alergias/intolerancias, air fryer, suplementos, nivel de cocina, presupuesto semanal y gestión de gimnasio (unirse a uno existente o crear el tuyo con 7 máquinas de ejemplo). Precarga tus datos si ya tenías perfil, para completar solo lo nuevo"
      ],
      fixes: []
    },
    {
      version: "3.11.0",
      date: "26/09/2026",
      features: [
        "Consulta \"¿Qué toca hoy?\" en /nutricion: comida y cena recomendadas según el día, con botón para ver otras opciones (rota entre las recetas del resto de la semana); media mañana y merienda muestran todas sus alternativas",
        "Lista de la compra desde /compra: nuevo botón \"Desde mi plan de nutrición\" que la genera a partir del plan activo real"
      ],
      fixes: [
        "/nutricion mostraba las tarjetas de comida y cena vacías: esperaban ingredientes embebidos por comida, pero el plan real referencia recetas por id",
        "El generador de lista de la compra del módulo de nutrición devolvía siempre \"no se encontraron ingredientes\": mismo problema de contrato, ahora usa la lista de la compra ya calculada del plan"
      ]
    },
    {
      version: "3.10.0",
      date: "26/09/2026",
      features: [
        "Menú semanal \"alta en proteínas\" (14 recetas para 4 personas, lunes-domingo, con lista de la compra) se asigna automáticamente a cualquier usuario que seleccione ese tipo de dieta en su perfil y aún no tenga plan propio"
      ],
      fixes: [
        "El onboarding real (/api/user/onboarding) llevaba tiempo roto contra el esquema actual (weight/height/goalWeight/avoidedFoods no existían): ningún usuario nuevo podía completar el registro. Reescrito contra el esquema real",
        "Recipe no tenía dónde guardar los pasos de preparación de una receta"
      ]
    },
    {
      version: "3.9.1",
      date: "26/09/2026",
      features: [],
      fixes: [
        "Cambiar de gimnasio activo con máquinas nuevas rompía /entrenamiento con un error 500 (el orden de los ejercicios se calculaba por posición dentro del gimnasio actual, pero debe ser único en todo el plan, que se comparte entre gimnasios)"
      ]
    },
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
