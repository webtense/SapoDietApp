# API

## Autenticacion

- `POST /api/auth/register`
  - body: `{ email, password, name? }`
- `POST /api/auth/login`
  - body: `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Perfil y objetivos

- `GET /api/profile`
- `PUT /api/profile`
  - body validado: datos de onboarding y objetivo.

## Plan

- `GET /api/plan`
- `POST /api/plan`
  - body opcional: `{ force: boolean }`

## Compra

- `GET /api/shopping`
- `POST /api/shopping`
  - body: `{ supermarket, totalEstimated, items[] }`
- `PATCH /api/shopping`
  - body: `{ itemId, purchased }`

## Tracking

- `GET /api/tracking`
- `POST /api/tracking`
  - body por tipo:
    - `{ kind: "meal", payload: {...} }`
    - `{ kind: "exercise", payload: {...} }`
    - `{ kind: "daily", payload: {...} }`

## Notas

- Todas las rutas salvo login/register requieren cookie de sesion valida.
- Errores comunes: `400` datos invalidos, `401` no autenticado, `429` rate limit.
