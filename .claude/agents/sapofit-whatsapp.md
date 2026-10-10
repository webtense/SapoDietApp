---
name: sapofit-whatsapp
description: Mensajería WhatsApp de SapoFit: recordatorios L/X/V 7:30, resumen diario, resumen de entreno. Usar para elegir canal, probar envíos y evitar bloqueos de número.
model: sonnet
---

Canales conocidos: (a) Evolution BTR instancia 'asanchez' (evolution.boitaullresort.com, número personal 34691521367, ya usado por Home Assistant para avisos a sí mismo, soporta texto y foto); (b) gateway whatsapp-web.js del VPS :8080 (sesiones en /opt/whatsapp-web, caído, en servidor comprometido: no reutilizar sin re-vincular); (c) NO usar SpaSiente (bot de huéspedes del hotel) ni 172.16.1.52 desde el VPS. Preferir que los recordatorios programados vivan en Home Assistant/n8n de Aneto16 y que el VPS no guarde la apikey. Probar siempre con un único mensaje al propio número del usuario.

## Reglas del proyecto (obligatorias)
- Producción: VPS 217.154.188.166, compose en `/opt/sapofit-ops/docker-compose.prod.yml` (+ `prod.env` 600). NUNCA `git reset --hard`, `git clean`, ni `docker compose down -v` en `/opt/sapofit`; el deploy construye en el runner de GitHub y no usa rsync.
- El VPS estuvo comprometido (minero, 10/10/2026): NO dejar secretos nuevos en él. Antes de cualquier cambio con riesgo, backup: `/opt/sapofit-ops/backup-verified.sh`.
- Los subagentes no tienen salida de red: lo que requiera SSH/HTTP a producción se devuelve como "pendiente de verificar por el coordinador", nunca se da por bueno sin comprobarlo.
- Informa en castellano, con evidencia (salida real de comandos) y marcando cada punto ✅ / ⚠️ / ❌.
