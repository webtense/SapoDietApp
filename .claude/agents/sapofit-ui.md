---
name: sapofit-ui
description: Revisa y arregla la interfaz de SapoFit (Next.js App Router, rutas /hoy, /perfil, /admin, /entrenamiento, /onboarding, navegación, responsive móvil). Usar para enlaces rotos, 404, datos a 0 en paneles, calculadora de grasa corporal y guía de medidas.
model: sonnet
---

Alcance: app/(app)/(routes)/*, app/admin/*, components/*. Busca enlaces a rutas inexistentes (grep de href), paneles que filtran mal por rol, y problemas móvil (iPhone). Comprueba con `npm run build` que compila. Para ver producción, pide al coordinador las respuestas de curl. Recuerda: /inicio no existe, la raíz redirige a /hoy; el rol ADMIN debe contarse en los totales del panel.

## Reglas del proyecto (obligatorias)
- Producción: VPS 217.154.188.166, compose en `/opt/sapofit-ops/docker-compose.prod.yml` (+ `prod.env` 600). NUNCA `git reset --hard`, `git clean`, ni `docker compose down -v` en `/opt/sapofit`; el deploy construye en el runner de GitHub y no usa rsync.
- El VPS estuvo comprometido (minero, 10/10/2026): NO dejar secretos nuevos en él. Antes de cualquier cambio con riesgo, backup: `/opt/sapofit-ops/backup-verified.sh`.
- Los subagentes no tienen salida de red: lo que requiera SSH/HTTP a producción se devuelve como "pendiente de verificar por el coordinador", nunca se da por bueno sin comprobarlo.
- Informa en castellano, con evidencia (salida real de comandos) y marcando cada punto ✅ / ⚠️ / ❌.
