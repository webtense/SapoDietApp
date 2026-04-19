# SapoFit

Version: **3.3**

Planificador de nutrición y entrenamiento con autenticación segura, seguimiento diario y panel de administración.

## Características

- Registro e inicio de sesión con cookie HttpOnly y sesiones persistidas en DB.
- Onboarding guiado en 5 pasos con validaciones Zod.
- Generación de plan nutricional y plan de ejercicios.
- Lista de compra semanal persistida.
- Seguimiento de comidas, ejercicios y check-in diario.
- Rate limiting persistente (Prisma).
- Migración lista a PostgreSQL para producción.
- Recordatorios v3.3 automáticos de entreno a las 19:00 según frecuencia, con envío Push + WhatsApp.
- Web Push con VAPID y Service Worker propio.
- Integración Evolution API para WhatsApp bidireccional.
- Cron unificado para n8n en un único workflow `sapofit`.

## Qué debe estar funcionando

- App Next.js en producción.
- PostgreSQL accesible desde Prisma.
- Evolution API accesible para WhatsApp (`EVOLUTION_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`).
- Web Push configurado (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- SMTP si quieres email real.
- n8n con un workflow único llamado `sapofit`.

## Flujo n8n `sapofit`

Antes de cambiar producción: hacer backup del workflow `sapofit` y de su BD/volumen.

Nodos mínimos recomendados dentro del workflow `sapofit`:

1. Cron cada minuto -> `POST /api/cron/reminders-dispatch`
2. Cron diario 00:00 -> `POST /api/cron/ai-quota-reset`
3. Webhooks/automatizaciones futuras se siguen añadiendo al mismo workflow.

Headers para los cron protegidos:

```text
Authorization: Bearer <CRON_SECRET>
```

## Stack

- Next.js 15 + React 19 + TypeScript
- Prisma ORM (SQLite local / PostgreSQL producción)
- Tailwind + componentes UI
- Zod para validaciones de API
- bcryptjs + sesiones con cookie HttpOnly

## Desarrollo local

### PostgreSQL (recomendado)

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

### SQLite (solo legado)

```bash
# Mantener prisma/schema.prisma solo para leer instalaciones antiguas.
# No se usa para producción ni para nuevas migraciones.
npm run dev
```

## Tests

```bash
npm test
```

## Despliegue en producción

### Requisitos previos
- Docker y Docker Swarm configurados
- Traefik como reverse proxy

### Variables de entorno recomendadas
- `DATABASE_URL` — PostgreSQL en producción (`postgresql://...`); SQLite (`file:./dev.db`) en desarrollo local
- `SESSION_COOKIE_NAME=sapofit_session`
- `SESSION_DAYS=7`
- `CRON_SECRET` (obligatoria para ejecutar `/api/cron/reminders-dispatch` y `/api/cron/ai-quota-reset`)
- `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` — seed del administrador
- `APP_URL` — URL pública usada en los enlaces de invitación
- `INVITATION_TTL_DAYS=7`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `EVOLUTION_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`
- `EVOLUTION_WEBHOOK_SECRET` (opcional, recomendado)

### Despliegue manual

```bash
# 1. Construir imagen
docker build -t sapofit:latest .

# 2. Crear volumen para PostgreSQL si no existe
docker volume create sapofit_postgres_data

# 3. Desplegar PostgreSQL
docker service create --name sapofit_postgres \
  --network easypanel \
  --env POSTGRES_DB='sapofit' \
  --env POSTGRES_USER='sapofit' \
  --env POSTGRES_PASSWORD='REEMPLAZAR' \
  --mount type=volume,source=sapofit_postgres_data,target=/var/lib/postgresql/data \
  postgres:16-alpine

# 4. Desplegar servicio web
docker service create --name sapofit \
  --network easypanel \
  --replicas 1 \
  --env DATABASE_URL='postgresql://sapofit:REEMPLAZAR@sapofit_postgres:5432/sapofit' \
  --env PRISMA_SCHEMA='prisma/schema.prisma' \
  --env SESSION_COOKIE_NAME='sapofit_session' \
  --env SESSION_DAYS='7' \
  --label traefik.enable=true \
  --label 'traefik.http.routers.sapofit-http.rule=Host(`sapofit.semillasdeti.com`)' \
  --label 'traefik.http.routers.sapofit-http.entrypoints=http' \
  --label 'traefik.http.routers.sapofit-http.middlewares=sapofit-https-redirect' \
  --label 'traefik.http.middlewares.sapofit-https-redirect.redirectscheme.scheme=https' \
  --label 'traefik.http.routers.sapofit.rule=Host(`sapofit.semillasdeti.com`)' \
  --label 'traefik.http.routers.sapofit.entrypoints=https' \
  --label 'traefik.http.routers.sapofit.tls=true' \
  --label 'traefik.http.routers.sapofit.tls.certresolver=letsencrypt' \
  --label 'traefik.http.services.sapofit.loadbalancer.server.port=3000' \
  sapofit:latest
```

### Actualizacion

```bash
# Sincronizar cambios y reconstruir
rsync -az --exclude 'node_modules' --exclude '.next' --exclude '.env' ./ root@TU_SERVITOR:/opt/sapofit/
ssh root@TU_SERVITOR "docker build -t sapofit:latest /opt/sapofit && docker service update --force sapofit"
```

### Staging y producción

- `develop` despliega a staging cuando el workflow `ci` termina en verde y existe `EASYPANEL_STAGING_WEBHOOK`.
- `main` despliega a producción cuando el workflow `ci` termina en verde y existe `EASYPANEL_PROD_WEBHOOK`.
- Mantén las variables reales solo en `.env` local, GitHub Secrets y Easypanel.

### Backup

El servicio incluye backup automatico diario a las 03:00 (cron). Backups en:
```
/opt/sapofit/backups/
```

Para hacer backup manual:
```bash
/opt/sapofit/backup.sh
```

### Monitoreo

```bash
# Ver logs del servicio
docker service logs sapofit

# Ver estado del servicio
docker service ls | grep sapofit
docker service ps sapofit
```

## Documentacion

Toda la documentacion esta en `DOC/`.

## Licencia

Apache-2.0 (`LICENSE`).
