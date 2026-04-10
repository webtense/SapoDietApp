# SapoFit

Planificador de nutrición y entrenamiento con autenticación segura, seguimiento diario y panel de administración.

## Características

- Registro e inicio de sesión con cookie HttpOnly y sesiones persistidas en DB.
- Onboarding guiado en 5 pasos con validaciones Zod.
- Generación de plan nutricional y plan de ejercicios.
- Lista de compra semanal persistida.
- Seguimiento de comidas, ejercicios y check-in diario.
- Rate limiting persistente (Prisma).
- Migración lista a PostgreSQL para producción.

## Stack

- Next.js 15 + React 19 + TypeScript
- Prisma ORM (SQLite local / PostgreSQL producción)
- Tailwind + componentes UI
- Zod para validaciones de API
- bcryptjs + sesiones con cookie HttpOnly

## Desarrollo local

### SQLite (predeterminado)

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

### PostgreSQL (docker-compose)

```bash
docker compose up -d postgres
# Editar .env y descomentar DATABASE_URL con la URL de postgres
npm run db:generate -- --schema=prisma/schema.postgresql.prisma
npm run db:migrate:pg
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
- `CRON_SECRET` (obligatoria para ejecutar `/api/cron/reminders`)
- `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` — seed del administrador
- `APP_URL` — URL pública usada en los enlaces de invitación
- `INVITATION_TTL_DAYS=7`

### Despliegue manual

```bash
# 1. Construir imagen
docker build -t sapofit:latest .

# 2. Crear volumen para datos persistentes
docker volume create sapofit_prisma

# 3. Desplegar servicio
docker service create --name sapofit \
  --network easypanel \
  --replicas 1 \
  --env DATABASE_URL='file:./dev.db' \
  --env SESSION_COOKIE_NAME='sapofit_session' \
  --env SESSION_DAYS='7' \
  --mount type=volume,source=sapofit_prisma,target=/app/prisma \
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
