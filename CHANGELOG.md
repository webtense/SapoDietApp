# Changelog — SapoFit

Todos los cambios significativos en este proyecto serán documentados en este archivo.

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
