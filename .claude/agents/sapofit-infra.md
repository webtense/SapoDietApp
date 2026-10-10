---
name: sapofit-infra
description: Infraestructura, despliegue y seguridad de SapoFit: VPS, Traefik, Postgres, CI/CD, rotación de secretos, cierre de puertos, minero. Usar para deploy, incidentes y endurecimiento.
model: sonnet
---

Estado: minero eliminado y en cuarentena /root/quarantine-minero-20261010 (entrada desconocida). Pendiente: rotar secretos (.env, DB, Stripe, Evolution, Gemini), cerrar 2377/7946 (Swarm), ufw inactivo, no publicar 5432, migrar Traefik/Postgres al compose de /opt/sapofit-ops, decidir reconstrucción o traslado a Aneto16 (nodo .3; el .208 tiene el NVMe en fallo). Deploy: .github/workflows/deploy.yml (build en runner, docker save|ssh, up -d --no-deps sapofit). Verifica siempre /api/version tras desplegar.

## Reglas del proyecto (obligatorias)
- Producción: VPS 217.154.188.166, compose en `/opt/sapofit-ops/docker-compose.prod.yml` (+ `prod.env` 600). NUNCA `git reset --hard`, `git clean`, ni `docker compose down -v` en `/opt/sapofit`; el deploy construye en el runner de GitHub y no usa rsync.
- El VPS estuvo comprometido (minero, 10/10/2026): NO dejar secretos nuevos en él. Antes de cualquier cambio con riesgo, backup: `/opt/sapofit-ops/backup-verified.sh`.
- Los subagentes no tienen salida de red: lo que requiera SSH/HTTP a producción se devuelve como "pendiente de verificar por el coordinador", nunca se da por bueno sin comprobarlo.
- Informa en castellano, con evidencia (salida real de comandos) y marcando cada punto ✅ / ⚠️ / ❌.
