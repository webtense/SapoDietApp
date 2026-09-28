# Changelog — SapoFit

Todos los cambios significativos en este proyecto serán documentados en este archivo.

---

## [3.17.0] — Septiembre 28, 2026

### ✨ Guardado de series a prueba de mala cobertura
- Reportado: "se han borrado los pesos". Causa real: guardar una serie hacía una única petición de red sin ningún reintento; si fallaba (wifi del gimnasio, sin cobertura), el dato se perdía sin aviso.
- Ahora el guardado es optimista: la serie se marca como guardada en el móvil al instante. Si la subida falla, queda en una cola local y se reintenta sola al recuperar conexión o al volver a abrir `/entrenamiento`. Un aviso ámbar muestra cuántas series quedan pendientes de subir.

### 🐛 Corrección
- `/gimnasios` estaba bloqueado por el asistente de bienvenida para cualquier cuenta que no lo hubiera completado, aunque gestionar máquinas no depende de tener peso/altura registrados. Liberado.

---

## [3.16.0] — Septiembre 28, 2026

### ✨ Botón +5 kg en el entreno
- Cada serie de cada máquina en `/entrenamiento` tiene ahora un botón "+5" junto al campo de kg: suma 5 al peso actual con un toque, sin tener que escribirlo a mano.

---

## [3.15.1] — Septiembre 27, 2026

### 🐛 Corrección
- Verificando el análisis de carta de restaurante en producción: una petición mal formada (sin la foto en el formato esperado) tumbaba el endpoint con un 500 real en vez de devolver un error claro. Corregido.

---

## [3.15.0] — Septiembre 27, 2026

### ✨ Motor de nutrición completo
- `lib/nutrition/scaling.ts` — escala ingredientes de una receta según los comensales reales (factor de ración de cada miembro del hogar).
- `lib/nutrition/conversions.ts` — devuelve el peso disponible más fiable de un ingrediente (crudo, cocinado, escurrido o congelado) sin inventar ratios de conversión entre estados que no existen de forma fiable.
- `lib/nutrition/safety.ts` — jerarquía real: una alergia bloquea la receta por completo; un alimento que no te gusta solo avisa. Integrado en `/api/nutrition/today`: si la receta de hoy está bloqueada, cae a la primera alternativa segura de la semana.
- `lib/nutrition/pantry.ts` + `POST /api/nutrition/shopping-list/generate-with-pantry` — resta de la lista de la compra lo que ya tienes en casa y avisa de lo que caduca en menos de 3 días.
- `lib/nutrition/eating-out.ts` + `POST /api/nutrition/eating-out/analyze` — sube una foto de la carta de un restaurante y la IA propone 3 opciones según tu dieta y alergias.

### ✨ Panel de retos operativo
- `Challenge` ahora tiene `tipo`, `objetivo`, `fechaInicio`, `fechaFin` y `status`. El progreso de cada participante se calcula automáticamente contando entrenamientos completados en el rango de fechas del reto, marca el reto como completado al alcanzar el objetivo y desbloquea el logro correspondiente.

### 🐛 Correcciones
- 44 errores de TypeScript por drift real entre código y esquema (no eran solo tipos: cada endpoint afectado habría fallado en producción al ejecutarse): backups de admin, ejercicios y modelos de máquina de admin, retos sociales, medidas corporales/peso/fotos de progreso. Verificado con escrituras y lecturas reales contra la base de datos de producción.
- Una sesión caducada producía un error 500 real: `getSessionUser()` intentaba borrar la cookie de sesión durante el renderizado de una página, algo que Next.js no permite fuera de una Route Handler o Server Action. El cierre de sesión normal ya lo hacía bien en su sitio y no se ha tocado.
- Eliminada `/entrenamiento-gym`, una versión antigua y huérfana de la pantalla de entrenamiento que ya nadie enlazaba.

---

## [3.14.0] — Septiembre 27, 2026

### ✨ Gestión de máquinas abierta a todos
- Reportado: "no puedo modificar las máquinas". Causa real: el gimnasio "Planet Fitness" (el único que existe, el que casi todos tienen activo) se sembró sin `createdById`, así que con la regla "solo el creador edita" **nadie** podía gestionarlo.
- Cambiado el criterio: cualquier usuario autenticado puede añadir/activar/desactivar máquinas en un gimnasio público. Renombrar o borrar el gimnasio en sí sigue reservado a quien lo creó.

---

## [3.13.1] — Septiembre 26, 2026

### 🐛 Corrección crítica — Gemini roto en silencio
- Verificando "Más opciones" en producción: la IA nunca respondía, siempre caía al fallback genérico. Causa real: `gemini-1.5-flash` ya no existe (Google lo retiró), la API devuelve 404 y el `catch` silencioso de cada endpoint lo ocultaba sin dejar rastro en los logs.
- Afectaba a las 3 únicas llamadas a Gemini del proyecto: `POST /api/plan/meal/alternatives` (nuevo hoy), `POST /api/ai/meal-photo` (análisis de foto, llevaba tiempo roto sin que nadie lo notara) y `POST /api/nutrition/plan/import` (importar PDF, roto desde que se creó hoy mismo). Las tres actualizadas a `gemini-2.5-flash`, verificado con una llamada real.

---

## [3.13.0] — Septiembre 26, 2026

### ✨ Más opciones de comida con IA
- El botón "Cambiar receta" de `/Hoy` existía en el diseño desde siempre pero nunca se implementó (deshabilitado). Ahora "Más opciones" llama a Gemini (`POST /api/plan/meal/alternatives`) y propone 3 alternativas para esa comida con calorías y macros equivalentes a las actuales, respetando el tipo de dieta y las alergias/alimentos a evitar del perfil.
- Al elegir una, `POST /api/plan/meal/replace` sustituye la receta de ese día en el plan, persistiéndola.
- Si no hay cuota de IA disponible ese día o falla la llamada, se ofrecen alternativas genéricas sin bloquear al usuario.

---

## [3.12.2] — Septiembre 26, 2026

### 🐛 Corrección
- El plan genérico "alta en proteínas" quedaba marcado `needsReview: true` por precaución excesiva al crearlo: revisando el documento real, prácticamente todo el contenido viene literal de él (recetas, desayuno, rotación de media mañana). Se quita la alerta bloqueante y se deja como nota informativa el único punto real: el total de jamón serrano de la lista de compra no cuadra exactamente con la suma de la rotación diaria (diferencia menor, no afecta a lo que se come cada día).

---

## [3.12.1] — Septiembre 26, 2026

### 🐛 Corrección crítica
- El paso final del onboarding V4 fallaba con `Invalid enum value. Expected 'M' | 'F', received 'hombre'` para cualquier usuario con perfil previo: el wizard asumía un enum `M`/`F` que **ningún perfil real usa** (todos, sin excepción, tienen `sex` guardado como `hombre`/`mujer`, igual que el resto de la app — `/perfil`, `/objetivo`, `/api/plan`). Wizard y endpoint alineados al formato real.

---

## [3.12.0] — Septiembre 26, 2026

### ✨ Onboarding V4
- Wizard de 8 pasos: datos básicos, medidas corporales (cintura/cadera/pecho, opcional), objetivo, entrenamiento, gimnasio (unirse/crear/saltar — crear siembra 7 máquinas de ejemplo reutilizando el catálogo compartido), nutrición (dieta, alimentos a evitar, alergias/intolerancias, air fryer, suplementos), cocina y compra (nivel de experiencia, presupuesto semanal), resumen final.
- Precarga los datos ya existentes de `/api/profile` al montar: quien repite el onboarding revisa y completa lo nuevo, no empieza de cero.
- Nuevos campos en `Profile`: `waistCm/hipCm/chestCm`, `allergies`, `hasAirFryer`, `takesSupplements/supplementsDetail`, `cookingLevel`, `weeklyBudget`, `onboardingVersion`.

---

## [3.11.0] — Septiembre 26, 2026

### ✨ Características nuevas
- **"¿Qué toca hoy?" en `/nutricion`** — nuevo endpoint `GET /api/nutrition/today`: calcula el día de la semana en la zona horaria del usuario y resuelve la receta real (ingredientes, pasos) de comida y cena. Cada una lleva un botón "Ver otras opciones" que despliega las recetas del resto de la semana como alternativas. Media mañana y merienda muestran todas sus opciones de proteína.
- **Lista de la compra desde el plan real** — botón "Desde mi plan de nutrición" en `/compra`.

### 🐛 Correcciones
- `/nutricion` renderizaba las tarjetas de comida/cena vacías: el componente esperaba `{nombre, ingredientes, instrucciones}` embebidos por comida, pero el plan real (tanto el de Zoraida como el genérico "alta en proteínas") referencia recetas por id (`recetasPorDia`). Reescrita la sección para consumir `/api/nutrition/today`.
- `POST /api/nutrition/shopping-list/generate` siempre devolvía "no se encontraron ingredientes en el plan" por el mismo desajuste de contrato; ahora usa `listaCompra4pax`/`listaCompraBase4pax`, la sección ya calculada y categorizada del plan.

---

## [3.10.0] — Septiembre 26, 2026

### ✨ Características nuevas
- **Menú "alta en proteínas" automático** — 14 recetas reales para 4 personas (lunes a domingo, comida y cena) con su lista de la compra, aportadas por el usuario. Cualquier persona que seleccione "Alta en proteínas" como tipo de dieta en su perfil recibe este plan automáticamente si no tiene ya uno propio (`lib/nutrition/high-protein-template.ts`). Aplicado también retroactivamente a los usuarios que ya tenían esa dieta seleccionada.

### 🐛 Correcciones críticas
- **El onboarding real estaba roto para cualquier usuario nuevo.** `app/api/user/onboarding/route.ts` (el que de verdad usa `OnboardingFlowV2`, no `/api/profile`) guardaba campos que no existen en el esquema desde hace tiempo (`weight`, `height`, `goalWeight`, `avoidedFoods`, `mealsPerDay`, `trainingLevel`): cualquier intento de completar el registro fallaba en Prisma. Reescrito contra `Profile.weightKg/heightCm/forbiddenFoods` y `Goal.targetWeightKg`.
- `Recipe` no tenía ningún campo para los pasos de preparación; añadido `instructions` (JSON de pasos).

---

## [3.9.1] — Septiembre 26, 2026

### 🐛 Corrección crítica
- Verificando v3.9.0 en producción: cambiar de gimnasio activo y añadir una máquina nueva rompía `/entrenamiento` con `Unique constraint failed on WorkoutExercise_workoutPlanId_order_key`. `lib/training/service.ts` calculaba el `order` de cada ejercicio por posición dentro de las máquinas del gimnasio *actual* (`i + 1`), pero `WorkoutPlan` (userId+planType) se comparte entre todos los gimnasios del usuario, así que la unicidad de `order` es sobre el plan completo, no por gimnasio. Corregido para continuar desde el máximo `order` ya existente en el plan.

---

## [3.9.0] — Septiembre 26, 2026

### ✨ Características nuevas
- **Gimnasios multiusuario** — `/gimnasios`: cualquier usuario crea su propio gimnasio (visible para todos), añade máquinas de un catálogo compartido o nuevas, y activa el gimnasio al que va desde `/gimnasios/[id]`. `/entrenamiento` ahora lista TODAS las máquinas activas del gimnasio activo del usuario, agrupadas Tren Superior/Inferior, en vez de un plan A/B/C fijo.
- **Calendario de entreno** (`/calendario-entreno`) — cada día de la semana tiene un grupo muscular (Superior/Inferior/Full/Descanso) y una etiqueta opcional. El recordatorio diario de entreno manda un push motivacional dinámico ("¡HOY: DÍA DE PIERNAS! 🔥🦵💥") según el día, y no manda nada en días de descanso.
- **Nutrición completada y conectada** — plan de nutricionista, comensales del hogar (raciones familiares), comida fuera de casa, lista de la compra automática desde el plan activo y sustitución de ingredientes por grupo. La página `/nutricion` pasa a consumir el módulo real (`/api/nutrition/*`) en vez del sistema antiguo.

### 🐛 Correcciones
- El cron de recordatorios (`/api/cron/reminders-dispatch`) llevaba desde su creación sin que nadie lo llamara; añadida la entrada real en el crontab del VPS y verificada en producción.
- `saveNutritionistPlan` intentaba archivar+crear un segundo plan por usuario violando `NutritionistPlan.userId @unique`; reescrito como actualización in-place con control de versión.
- El módulo de nutrición (schema + 4 endpoints, creado en septiembre) nunca se conectó a la UI real; `/nutricion` seguía usando `/api/plan` del sistema antiguo.
- Drift de esquema real corregido de paso (ver v3.8.0): `Profile.gymId`/`onboardingCompletedAt` restaurados, columna huérfana `subscriptionstatus` eliminada.

### 🗄️ Datos
- Sembrado el plan real de nutrición de Zoraida (horario de 5 comidas, 40g de pan en media mañana con el histórico de 60g descartado explícitamente, receta "Pan Pita" marcada `needsReview`), con backup previo en el VPS.

---

## [3.8.0] — Septiembre 26, 2026 (base de datos)

### 🗄️ Esquema
- `Gym`: `createdById` + `isPublic` — cualquier usuario podrá crear su propio gimnasio, visible para el resto.
- `WorkoutSchedule`: calendario semanal (día → grupo muscular UPPER/LOWER/FULL/REST) por usuario, para el push motivacional ("HOY: Día de piernas 💪").
- **Drift corregido:** `Profile.gymId` y `Profile.onboardingCompletedAt` estaban en uso real en `app/api/profile/route.ts` pero ausentes del `schema.prisma` del repo — restaurados con su relación/índice formal. `User.subscriptionstatus` (columna huérfana en minúsculas, sin relación con el `subscriptionStatus` real) eliminada.

Este release es solo de base de datos; el API/UI de estas features llega en los siguientes commits.

---

## [3.7.7] — Septiembre 26, 2026

### 🐛 Correcciones
- **Service Worker servía HTML antiguo para siempre.** En `public/sw.js` las rutas de la app (`/inicio`, `/entrenamiento`…) no coincidían con ninguna regla network-first y caían en cache-first: tras cada deploy el HTML cacheado apuntaba a chunks `_next/static` inexistentes (404) y la app quedaba sin CSS/JS ("Cargando…"). Era también la causa del "v3.7.0" persistente del 24-25/09. Ahora: navegaciones siempre por red (respuesta offline mínima si no hay conexión), `/api` sin caché, `_next/static` cache-first (inmutable), resto network-first. Al activarse un SW nuevo se recargan las pestañas abiertas (`clients.navigate` + `controllerchange` en `PwaRegister`).

---

## [3.7.6] — Septiembre 25, 2026

### ✨ Características nuevas
- **Catálogo Planet Fitness operativo** — 7 máquinas reales (Smith, Chest Press, Seated Row, Shoulder Press, Leg Press, Seated Leg Curl, Leg Extension) visibles en `/entrenamiento` (UPPER/LOWER) y gestionables en `/admin/machines`.
- **Historial recuperado** — series del 23/09 (prensa 54/63/72 kg, curl 48 kg, extensión 36 kg) migradas al modelo actual.
- **Deploy automático** — `deploy.yml` hace rsync + `docker build` + `service update` en el VPS tras CI verde y verifica `/api/version`.

### 🐛 Correcciones
- Menú lateral con versión fija `v3.7.0` (`components/main-nav.tsx`): ahora usa `APP_VERSION`.
- CI en rojo desde abril: `20260429120000_add_postal_code` y `20260429130000_shopping_share_and_price_obs` duplicaban `20260419195000`; ahora son idempotentes.
- Tablas snake_case huérfanas de la fusión SAPOGYM (21/09) eliminadas (`20260925120000_drop_legacy_gym_tables`); los datos reales vivían ahí y la app leía las PascalCase vacías.
- `prisma/seed.ts` reescrito contra el esquema real y vuelto a incluir en el type-check.
- `lib/training/progression.ts` (evolución por máquina y media móvil de peso) usaba campos del esquema antiguo y devolvía error 500; adaptado y reincorporado al type-check.
- `lib/training/plan-templates.ts` (planes A/B/C del esquema antiguo) fallaba en silencio en cada guardado de perfil; eliminado.
- `/entrenamiento` rompía en cliente (`Cannot read properties of undefined (reading 'map')`): la página esperaba la respuesta antigua del API (`plan.exercises`, planes A/B/C, `/start`, `/last`) que ya no existe. Reescrita contra el API real: sesión automática del día, Tren Superior/Inferior, series kg×reps, info de máquina y pestaña Progresión.
- Eliminado `<Analytics />` de Vercel (404 en `/_vercel/insights/script.js` fuera de Vercel).
- Eliminado `components/version-checker.tsx` (código muerto).

### 📝 Nota
Ninguna versión anterior se desplegó nunca vía GitHub: el workflow antiguo apuntaba a webhooks de EasyPanel inexistentes.

---

## [3.7.0] — Septiembre 23, 2026

### ✨ Características nuevas
- **Módulo de Planificación Nutricional** — Integración completa:
  - Importación de planes PDF de nutricionista (estructura de datos JSON)
  - Gestión de miembros del hogar (escalado de raciones por comensal)
  - Catálogo de recetas con ingredientes, macros, alérgenos y métodos de cocción
  - Grupos de sustituciones (proteínas, hidratos, verduras intercambiables)
  - Modo despensa: registrar alimentos disponibles, priorizar por caducidad
  - Modo restaurante: registrar comidas fuera de casa con estimaciones
  - Rutas API: `/api/nutrition/plan/{import,current}`, `/api/nutrition/recipes`, `/api/nutrition/pantry`
- **Backend lógico puro** (`lib/nutrition/service.ts`) — sin dependencias de Next.js, reutilizable en tests

### 📝 Cambios internos
- Nuevos modelos Prisma: `NutritionistPlan`, `HouseholdMember`, `Recipe`, `RecipeIngredient`, `RecipeVariant`, `SubstitutionGroup`, `SubstitutionItem`, `PantryItem`, `EatingOutLog`
- Migración Prisma: `20260923_add_nutrition_models` (9 tablas nuevas, indexes, foreign keys)
- Actualización User: relaciones a planes nutricional, pantry, eating-out logs

---

## [3.6.0] — Septiembre 23, 2026

### ✨ Características nuevas
- **Módulo de Máquinas de Gimnasio (COMPLETO)** — Gestión y seguimiento completo:
  - Admin panel (`/admin/machines`) para crear/editar máquinas
  - Asignar grupo muscular (Tren Superior / Tren Inferior / Full Body)
  - Definir peso recomendado, instrucciones y recomendaciones
  - Asignación directa a gimnasio (Planet Fitness) en el formulario de creación
- **Selector de Grupo Muscular** en `/entrenamiento`:
  - Pills: Tren Superior / Tren Inferior
  - Carga automática de máquinas por grupo
- **Entrada de Pesos por Serie** — 3 inputs para 3 series (12 reps cada una)
  - Botón "OK" para guardar cada serie (upsert en BD)
- **Modal de Información** — Botón ℹ️ en cada máquina:
  - Descripción, instrucciones, recomendaciones y peso sugerido
- **Terminar Sesión** — Botón para marcar sesión como completada

### 📝 Cambios internos
- Nuevos modelos Prisma: `Gym`, `MachineModel`, `GymMachine`, `MachineWeightOption`
- Nuevas rutas API: `GET /api/admin/gyms`, `GET/POST /api/admin/machines`, `GET /api/user/gym/machines`
- Nuevas rutas runtime: `GET /api/user/workout/current?group=`, `POST /api/user/workout/exercise/[id]/set`, `POST /api/user/workout/end`
- Nuevo componente: `MaquinasSection` (reutilizable en `/entrenamiento`)
- Migración Prisma: `20260923_add_machine_models` (4 páginas, aplicada en CT206)

### 🔍 Nota sobre v3.5.0
La versión 3.5.0 incluía el CHANGELOG del módulo de máquinas pero **no incluía el código ni la UI de usuario** — solo backend CRUD de bajo nivel. Esta versión (3.6.0) completa la implementación con runtime, UI y verificación end-to-end.

---

## [3.5.0] — Septiembre 2026

### ℹ️ Corrección histórica
Esta versión fue commitada con el CHANGELOG que describía un módulo de máquinas "completo", pero el código real contenía **solo backend CRUD** (`MachineModel`, `GymMachine` en Prisma + rutas admin básicas). Faltaba:
- Rutas de runtime (`/api/user/workout/current`, `exercise/*/set`, `workout/end`)
- UI de usuario en `/entrenamiento` (pills de grupo, componente máquinas, modal info)
- Migración aplicada en BD
- Tests end-to-end

El módulo se completó en **v3.6.0**.

### 📝 Cambios internos (reales, solo backend)
- Estructurados modelos Prisma: `Gym`, `MachineModel`, `GymMachine`
- Creadas rutas admin CRUD: `/api/admin/machines`

---

## [3.4.1] — Septiembre 23, 2026

### 🐛 Correcciones
- **Admin logout roto** — Agregado botón logout funcional en `/admin/layout.tsx`
- **DELETE usuario falla (HTTP 500)** — Arreglado bug de `params` async en Route Handlers de Next.js 16
  - Afectaba 3 rutas: `/api/admin/users/[id]`, `/api/admin/users/[id]/activity`, `/api/admin/invitations/[id]/resend`
- Redireccionamiento correcto admin → `/admin` (sin bucle)

---

## [3.4.0] — Abril 2026

### ✨ Características nuevas
- **Edición de Series** — Editar series ya registradas mediante upsert
- **Progresión de Ejercicios** — Vista gráfica de 1RM estimado (Epley) por ejercicio
  - Endpoint GET `/api/user/workout/exercise/[id]/progression`
  - Gráfica Recharts con histórico de sesiones
- **Selector dinámico de Gimnasio** en onboarding
- **Catálogo de Planet Fitness** — Máquinas reales fotografiadas en vivo
- **Sistema de Planes (A/B/C)** — Rotación automática de rutinas

### 🐛 Correcciones
- Selector gimnasio infinito (no cargaba gimnasios) — Replicado en BD producción
- Migraciones schema drift (`ShoppingShare`, `Profile.postalCode`) resueltas

### 📝 Cambios internos
- Actualización a Next.js 16 + Prisma 7.10
- Migración a `@prisma/adapter-pg` (driver adapters)
- Creados modelos de gimnasio: `Gym`, `Exercise`, `MachineModel`, `WorkoutSession`, etc.

---

## [3.3.0] — Anterior

*Historial previo no documentado. Versión inicial de sapofit con nutrición, notificaciones, checkout Stripe.*

---

## Convenciones de Versionado

- **Patch (3.4.X)** — Correcciones de bugs, cambios menores
- **Minor (3.X.0)** — Nuevas características, módulos completos
- **Major (4.0.0)** — Cambios breaking, reestructuraciones importantes

**Formato de fecha:** `Mes AAAA` o `DD Mes AAAA` para patches puntuales.
