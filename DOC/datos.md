# Modelo de Datos

## Tecnologia

- Prisma ORM.
- SQLite local en `prisma/dev.db`.

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

- Generar cliente: `pnpm db:generate`.
- Crear/aplicar migracion: `pnpm db:migrate --name init`.
- Seed: `pnpm db:seed`.

## Evolucion futura

- Migrar a Postgres en servidor sin cambiar dominio de entidades.
- Separar snapshots de plan en tablas normalizadas si se requiere analitica avanzada.
