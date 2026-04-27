# Arquitectura

## Stack

- Frontend y backend: Next.js (App Router).
- Persistencia: SQLite (`prisma/dev.db`).
- ORM: Prisma.
- Validacion: Zod.
- Seguridad de contrasena: bcrypt.
- UI: componentes en `components/ui` + Tailwind.

## Modulos principales

- `app/page.tsx`: experiencia principal (auth, onboarding, plan y seguimiento).
- `app/api/auth/*`: registro, login, logout y sesion actual.
- `app/api/profile`: perfil y metas de usuario.
- `app/api/plan`: generacion y persistencia del plan nutricional/entrenamiento.
- `app/api/shopping`: lista de compra persistida y cambio de estado de items.
- `app/api/tracking`: logs diarios de comidas, ejercicios y check-in.
- `lib/server/*`: utilidades de seguridad, Prisma y limite de peticiones.

## Persistencia

- Las sesiones se guardan en DB con `tokenHash`.
- La cookie guarda solo el token aleatorio y es `HttpOnly`.
- Los datos funcionales se guardan por usuario y fecha.

## Principios aplicados

- Evitar secretos embebidos en codigo.
- Validar entradas del cliente en API.
- Diseñar para evolucionar de SQLite a Postgres sin reescritura profunda.
