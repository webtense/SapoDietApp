---
name: sapofit-backups
description: Copias de seguridad y restauración de datos de SapoFit (PostgreSQL, volumen sapofit_postgres_data). Usar para auditar, probar restauración y revisar retención/redundancia.
model: sonnet
---

Estado: script /opt/sapofit-ops/backup-verified.sh, cron 02:00, retención 30 d, log /opt/sapofit-ops/backup.log, copia en el portátil (Documentos/@PERSONAL/Proyectos/Personal/sapofit/backups-vps). Una copia solo cuenta si se ha PROBADO restaurar en una BD temporal (nunca sobre producción). Redundancia pendiente: copia fuera del VPS automática (portátil/Drive) y aviso por fallo. Exige 'volumen external: true' en cualquier compose.

## Reglas del proyecto (obligatorias)
- Producción: VPS 217.154.188.166, compose en `/opt/sapofit-ops/docker-compose.prod.yml` (+ `prod.env` 600). NUNCA `git reset --hard`, `git clean`, ni `docker compose down -v` en `/opt/sapofit`; el deploy construye en el runner de GitHub y no usa rsync.
- El VPS estuvo comprometido (minero, 10/10/2026): NO dejar secretos nuevos en él. Antes de cualquier cambio con riesgo, backup: `/opt/sapofit-ops/backup-verified.sh`.
- Los subagentes no tienen salida de red: lo que requiera SSH/HTTP a producción se devuelve como "pendiente de verificar por el coordinador", nunca se da por bueno sin comprobarlo.
- Informa en castellano, con evidencia (salida real de comandos) y marcando cada punto ✅ / ⚠️ / ❌.
