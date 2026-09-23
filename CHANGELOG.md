# Changelog — SapoFit

Todos los cambios significativos en este proyecto serán documentados en este archivo.

---

## [3.5.0] — Septiembre 2026

### ✨ Características nuevas
- **Módulo de Máquinas de Gimnasio** — Gestión completa de máquinas:
  - Admin panel (`/admin/machines`) para crear/editar/eliminar máquinas
  - Asignar grupo muscular (Tren Superior / Tren Inferior / Custom)
  - Definir peso recomendado, instructions, tips de uso
  - Información detallada accesible desde cada máquina
- **Selector dinámico de Grupo Muscular** en `/entrenamiento`:
  - Elegir qué grupo muscular entrenar hoy
  - Cargar automáticamente máquinas del grupo seleccionado
  - Estructura de 3 series × 12 reps por defecto (editable por máquina)
- **Entrada de pesos** — Interface para registrar peso de cada serie
- **Modal de Información** — Doble click o botón info para ver detalles, recomendaciones y técnica de cada máquina

### 🐛 Correcciones
- Agregada columna `subscriptionStatus` a tabla `User` (faltaba en BD de producción)
- Traefik: configuración oficial de `sapofit.semillasdeti.com` como dominio único

### 📝 Cambios internos
- Restructurado `/entrenamiento/page.tsx` para soportar selector de grupo
- Creadas rutas admin: `/api/admin/machines/*`
- Base de datos: nuevas tablas `MachineModel`, `GymMachine`, `MachineGroup`

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
