# Despliegue

## Local (PostgreSQL — desarrollo recomendado)

1. Copiar variables:

```bash
cp .env.example .env
```

2. Instalar dependencias:

```bash
npm install
docker compose up -d postgres
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

## Local con SQLite (solo legado)

```bash
cp .env.example .env
# El schema SQLite se conserva solo para lectura y migración de datos antiguos.
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
  - `PRISMA_SCHEMA=prisma/schema.prisma`
  - `SESSION_COOKIE_NAME`, `SESSION_DAYS`
  - `CRON_SECRET`
  - `APP_URL`
  - `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
  - `GEMINI_API_KEY`
  - `VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
  - `EVOLUTION_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `EVOLUTION_WEBHOOK_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Staging y producción por CI/CD

- `ci.yml` ejecuta migraciones de prueba, `lint`, `test` y `build`.
- `deploy.yml` solo dispara staging/prod cuando `ci` termina con éxito.
- Secrets requeridos en GitHub:
  - `EASYPANEL_STAGING_WEBHOOK`
  - `EASYPANEL_PROD_WEBHOOK`

## Migración SQLite → PostgreSQL (produccion)

Ver `DOC/POSTGRES_MIGRATION.md`.

## Checklist previo a subir

- `npm run build` sin errores.
- `npm run db:deploy` probado contra PostgreSQL.
- Sin secretos en commits.
- Credenciales rotadas.
- Backup de base de datos.
- Tests pasando: `npm test`.
