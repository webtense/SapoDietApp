# Modelo de Datos

## Tecnologia

- Prisma ORM.
- PostgreSQL como base principal.
- SQLite local solo para lectura y migración de instalaciones antiguas.

## Entidades principales

- `User`: credenciales y datos base.
- `Session`: sesiones activas con hash de token y expiracion.
- `Profile`: perfil biometrico y preferencias.
- `Goal`: objetivos de peso y viabilidad.
- `MealPlan`: snapshot del plan generado.
- `MealLog`: adherencia por tipo de comida y dia.
- `ExerciseLog`: registro por ejercicio y dia.
- `ShoppingList` y `ShoppingItem`: listas de compra persistidas.
- `DailyLog`: check-in consolidado diario.

## Convenciones

- Claves `cuid()` para ids.
- Fechas normalizadas por dia para registros diarios.
- Unicidad por `(userId, date, type)` donde aplica.

## Migraciones

- Generar cliente: `npm run db:generate`.
- Crear/aplicar migracion: `npm run db:migrate -- --name init`.
- Desplegar migraciones: `npm run db:deploy`.
- Seed: `npm run db:seed`.

## Evolucion futura

- Mantener una única historia de migraciones PostgreSQL en `prisma/migrations-postgresql`.
- Separar snapshots de plan en tablas normalizadas si se requiere analitica avanzada.
