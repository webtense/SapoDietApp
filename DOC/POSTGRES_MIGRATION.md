# Migración de SQLite a PostgreSQL para SapoFit

## Por qué PostgreSQL

- Concurrencia real con múltiples usuarios simultáneos.
- Backups consistentes con herramientas estándar de Postgres.
- Listo para escalar horizontalmente.
- Prisma soporta ambos motores sin cambios profundos en el código.

## Paso 0 — Backup

```bash
cp prisma/dev.db prisma/dev.db.backup
```

## Paso 1 — Preparar el entorno PostgreSQL

### EasyPanel

1. Ir a **Databases** → crear base de datos PostgreSQL.
2. Anotar la URL de conexión:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

### Docker Compose (desarrollo)

```bash
docker compose up -d postgres
```

La URL de conexión es:
```
postgresql://sapofit:sapofit_local@localhost:5432/sapofit
```

## Paso 2 — Generar cliente Prisma para PostgreSQL

```bash
npm run db:generate -- --schema=prisma/schema.postgresql.prisma
```

Esto genera el cliente en `node_modules/@prisma-client-pg`.

## Paso 3 — Crear esquema en PostgreSQL

```bash
npm run db:migrate:pg -- --name init_pg
```

O para producción (sin crear migración nueva, solo aplicar las existentes):

```bash
npm run db:migrate:pg:deploy
```

## Paso 4 — Migrar datos existentes

```bash
# 1. Configurar ambas URLs en el entorno
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
export SQLITE_URL="file:./prisma/dev.db"

# 2. Ejecutar migración de datos
npm run db:pg:migrate:data

# 3. Confirmar sin confirmar la migración (dry-run)
npx tsx prisma/migrate-to-postgres.ts
```

El script `migrate-to-postgres.ts`:
- Lee todos los registros de cada modelo en SQLite.
- Los inserta o actualiza en PostgreSQL usando `upsert`.
- Muestra progreso por modelo.
- Solo ejecuta si se pasa `--confirm`.

## Paso 5 — Actualizar variables de producción

En EasyPanel o `.env` de producción:

```env
# Cambiar de:
DATABASE_URL="file:./dev.db"

# A:
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

## Paso 6 — Verificar

```bash
npm run build && npm test
```

## Volver a SQLite (si es necesario)

```bash
git checkout prisma/schema.prisma
npm run db:generate
```

## Notas técnicas

### Enums

El schema de PostgreSQL (`schema.postgresql.prisma`) usa `String` en lugar de enums nativos de Prisma. Esto evita conflictos de tipos entre SQLite (TEXT) y PostgreSQL (CREATE TYPE). El código de la aplicación no cambia.

### Rate limit

`RateLimitBucket` funciona igual con ambos motores. En PostgreSQL es más robusto bajo carga.

### Sesiones

Las sesiones existentes en SQLite tienen `tokenHash` y expiración. Al migrar, los usuarios necesitarán volver a iniciar sesión.

### Datos sensibles

Los `passwordHash` se migran sin modificación; bcrypt funciona igual en ambos motores.

### Limpieza posterior

Después de verificar que PostgreSQL funciona correctamente:

```bash
rm prisma/dev.db
```

Mantener el backup hasta confirmar estabilidad en producción.
