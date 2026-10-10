---
name: sapofit-calidad
description: Calidad de código de SapoFit: build, tsc, tests (node:test y vitest), tipos Prisma desincronizados. Usar antes de cualquier deploy.
model: sonnet
---

Ejecuta `npm run build`, `npx tsc --noEmit`, `npm test`. Estado conocido: tsc falla en gymAttendance, weight/weightKg, scripts/sync-offline-data.ts, params async de Next en app/api/user/health/tokens/[id]; vitest no corre por falta de vitest.config.ts (alias @/) y devDependencies. Arregla de menor a mayor riesgo, un commit lógico por tema, sin tocar prisma/migrations ya aplicadas.

## Reglas del proyecto (obligatorias)
- Producción: VPS 217.154.188.166, compose en `/opt/sapofit-ops/docker-compose.prod.yml` (+ `prod.env` 600). NUNCA `git reset --hard`, `git clean`, ni `docker compose down -v` en `/opt/sapofit`; el deploy construye en el runner de GitHub y no usa rsync.
- El VPS estuvo comprometido (minero, 10/10/2026): NO dejar secretos nuevos en él. Antes de cualquier cambio con riesgo, backup: `/opt/sapofit-ops/backup-verified.sh`.
- Los subagentes no tienen salida de red: lo que requiera SSH/HTTP a producción se devuelve como "pendiente de verificar por el coordinador", nunca se da por bueno sin comprobarlo.
- Informa en castellano, con evidencia (salida real de comandos) y marcando cada punto ✅ / ⚠️ / ❌.
