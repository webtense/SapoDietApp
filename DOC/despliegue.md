# Despliegue

## Local (SQLite — desarrollo)

1. Copiar variables:

```bash
cp .env.example .env
```

2. Instalar dependencias:

```bash
npm install
```

3. Inicializar DB:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

4. Ejecutar app:

```bash
npm run dev
```

## Local con Docker Compose (PostgreSQL)

```bash
docker compose up -d postgres
cp .env.example .env
# Editar .env y descomentar la línea DATABASE_URL con la URL de PostgreSQL
# DATABASE_URL="postgresql://sapofit:sapofit_local@localhost:5432/sapofit"
npm run db:generate -- --schema=prisma/schema.postgresql.prisma
npm run db:migrate:pg
npm run dev
```

Para levantar todo:

```bash
docker compose up -d
```

Para detener:

```bash
docker compose down
```

## EasyPanel (producción)

- Crear base de datos PostgreSQL en EasyPanel.
- Anotar la URL de conexión.
- Configurar servicio Node con build `npm run build` y start `npm run start`.
- Definir variables de entorno:
  - `DATABASE_URL` (PostgreSQL)
  - `SESSION_COOKIE_NAME`, `SESSION_DAYS`
  - `CRON_SECRET`
  - `APP_URL`

## Migración SQLite → PostgreSQL (produccion)

Ver `DOC/POSTGRES_MIGRATION.md`.

## Checklist previo a subir

- `npm run build` sin errores.
- Sin secretos en commits.
- Credenciales rotadas.
- Backup de base de datos.
- Tests pasando: `npm test`.
