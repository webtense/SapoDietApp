# Migración de SQLite a PostgreSQL para SapoFit

## Cuándo迁移 a PostgreSQL

- Cuando hay múltiples usuarios simultáneos
- Cuando se necesita mayor rendimiento
- Cuando se requieren backups más robustos
- Cuando se escala horizontalmente

## Preparación Actual (Cambios en Código)

El código ya está preparado para funcionar con PostgreSQL. Solo requiere cambiar la URL de conexión.

## Pasos para Migrar en EasyPanel

### 1. Crear Base de Datos PostgreSQL en EasyPanel

En el panel EasyPanel:
- Ir a "Databases" o "Bases de datos"
- Crear nueva base de datos PostgreSQL
- Anotar los datos de conexión (host, port, database, user, password)

### 2. Actualizar Variables de Entorno

Cambiar en el servicio:
```env
# SQLite (actual)
DATABASE_URL="file:./dev.db"

# PostgreSQL (nuevo)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 3. Ejecutar Migraciones

```bash
# En el contenedor del servicio
npx prisma migrate deploy
npx prisma generate
```

### 4. Scripts de Migración Incluidos

Ya tenemos:
- `prisma/schema.prisma` compatible con PostgreSQL
- `entrypoint.sh` que ejecuta migraciones automáticamente

## Configuración PostgreSQL en Schema

El schema actual de Prisma funciona tanto con SQLite como con PostgreSQL sin cambios:

```prisma
datasource db {
  provider = "sqlite" // cambiar a "postgresql" para Postgres
  url      = env("DATABASE_URL")
}
```

## Para Realizar la Migración (Cuando Decidas)

1. **Exportar datos de SQLite**:
   ```bash
   docker cp sapofit.1:/app/prisma/dev.db ./backup.db
   ```

2. **Crear base de datos PostgreSQL** en EasyPanel

3. **Cambiar DATABASE_URL** en variables de entorno

4. **Ejecutar migraciones**:
   ```bash
   docker service update --env-rm DATABASE_URL --env-add DATABASE_URL="postgresql://..." sapofit
   ```

5. **Verificar funcionamiento**

## Notas

- Los datos de usuarios y seguimiento se migrarán automáticamente con las migraciones
- La estructura de tablas es compatible
- Solo cambia el motor de base de datos, no el schema

## Preparación Ya Completada

✅ Schema Prisma compatible con PostgreSQL  
✅ Scripts de migración incluidos  
✅ Entry point que ejecuta migraciones  
✅ Documentación de pasos

¿Te gustaría que ejecute la migración ahora o prefieres esperar a tener más datos/usuarios?