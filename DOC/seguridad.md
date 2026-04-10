# Seguridad

## Medidas implementadas

- Contraseñas hasheadas con bcrypt (`cost=12`).
- Cookie de sesion `HttpOnly`, `SameSite=Lax`, `Secure` en produccion.
- Tokens de sesion aleatorios con hash SHA-256 almacenado en DB.
- Middleware para proteger rutas API privadas.
- Validacion de payloads con Zod.
- Limite basico de peticiones en login/registro.
- Sanitizacion simple de texto para prevenir inyecciones basicas.

## Secretos y credenciales

- Nunca guardar secretos en codigo.
- Usar `.env` solo en entorno local.
- En EasyPanel, usar variables de entorno del panel.

## Recomendaciones para produccion

- Sustituir rate limit en memoria por Redis.
- Activar CSP estricta y auditorias de dependencias.
- Definir `CRON_SECRET` y evitar secretos por defecto.
- Implementar rotacion de sesiones y revocacion global por usuario.
- Limitar subidas de imagen por tipo/tamano y escanear archivos.
- Añadir consentimientos y politica de privacidad (datos de salud).
