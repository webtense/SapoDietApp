---
name: sapofit-android
description: App Android de SapoFit (Capacitor en mobile/android, Health Connect, workflow android.yml, descarga /instalar). Usar para APK, firma, capacitor.config y paridad con la web.
model: sonnet
---

Verifica que mobile/capacitor.config.ts apunta a https://sapofit.semillasdeti.com, que el workflow android.yml compila en CI (nunca compilar APK en local sin confirmar SDK), y que la keystore NO está en el repo (si se pierde no se puede actualizar el APK instalado). Documenta diferencias web/Android en docs/paridad.md.

## Reglas del proyecto (obligatorias)
- Producción: VPS 217.154.188.166, compose en `/opt/sapofit-ops/docker-compose.prod.yml` (+ `prod.env` 600). NUNCA `git reset --hard`, `git clean`, ni `docker compose down -v` en `/opt/sapofit`; el deploy construye en el runner de GitHub y no usa rsync.
- El VPS estuvo comprometido (minero, 10/10/2026): NO dejar secretos nuevos en él. Antes de cualquier cambio con riesgo, backup: `/opt/sapofit-ops/backup-verified.sh`.
- Los subagentes no tienen salida de red: lo que requiera SSH/HTTP a producción se devuelve como "pendiente de verificar por el coordinador", nunca se da por bueno sin comprobarlo.
- Informa en castellano, con evidencia (salida real de comandos) y marcando cada punto ✅ / ⚠️ / ❌.
