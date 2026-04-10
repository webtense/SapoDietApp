# SapoFit

Aplicacion de nutricion y entrenamiento con persistencia local en SQLite, autenticacion segura y seguimiento diario.

## Caracteristicas

- Registro e inicio de sesion con cookie HttpOnly.
- Onboarding guiado en 5 pasos con validaciones.
- Generacion de plan nutricional y plan de ejercicios.
- Lista de compra semanal persistida.
- Seguimiento de comidas, ejercicios y check-in diario.

## Stack

- Next.js 15 + React 19
- Prisma + SQLite
- Tailwind + componentes UI
- Zod para validaciones de API

## Puesta en marcha local

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

## Despliegue en produccion

### Requisitos previos
- Docker y Docker Swarm configurados
- Traefik como reverse proxy

### Variables de entorno recomendadas
- `DATABASE_URL=file:./dev.db`
- `SESSION_COOKIE_NAME=sapofit_session`
- `SESSION_DAYS=7`
- `CRON_SECRET` (obligatoria para ejecutar `/api/cron/reminders`)
- `ADMIN_EMAIL` (por defecto `webtense@gmail.com`)
- `ADMIN_NAME` (por defecto `Andres`)
- `ADMIN_PASSWORD` (opcional, usado al seed para fijar contraseña del administrador)
- `APP_URL` (URL pública usada en los enlaces de invitación)
- `INVITATION_TTL_DAYS` (días de validez de la invitación, por defecto `7`)

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
