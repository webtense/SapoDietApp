# Integración de SapoFit en EasyPanel

## Opción 1: Servicio Docker existente (YA DESPLEGADO)

El servicio SapoFit ya está funcionando como servicio Docker Swarm y es accesible desde:
- **URL**: https://sapofit.semillasdeti.com
- **Estado**: Activo y funcionando
- **Backup**: Automático diario a las 03:00

Este método no aparece como "app" en el panel EasyPanel pero funciona correctamente.

## Opción 2: Agregar como App Node.js en EasyPanel (Manual)

Para gestionar SapoFit desde la interfaz de EasyPanel:

1. **Acceder al panel EasyPanel**
   - Ir a: https://easypanel.semillasdeti.com (o tu dominio de panel)
   - Iniciar sesión como administrador

2. **Crear nueva aplicación**
   - Click en "Crear aplicación" o "New App"
   - Seleccionar tipo: "Node.js"

3. **Configuración**
   - **Nombre**: SapoFit
   - **Dominio**: sapofit.semillasdeti.com
   - **Build**: npm run build
   - **Start**: npm run start
   - **Puerto**: 3000

4. **Variables de entorno** (en la sección "Environment"):
   ```
   DATABASE_URL=file:./dev.db
   SESSION_COOKIE_NAME=sapofit_session
   SESSION_DAYS=7
   ```

5. **Volumen persistente** (montar para preservar SQLite):
   - Path: /app/prisma
   - Tipo: Volume

6. **Desplegar**
   - EasyPanel detectará automáticamente el servicio existente si el dominio coincide.

## Opción 3: Mantener como está (RECOMENDADO)

El servicio actual funciona perfectamente. Para gestión:
- **Logs**: `docker service logs sapofit`
- **Estado**: `docker service ls | grep sapofit`
- **Reiniciar**: `docker service update --force sapofit`
- **Backup**: Verificar en `/opt/sapofit/backups/`

## Notas importantes

- EasyPanel 2.28.0 gestiona proyectos mediante archivos de configuración en `/etc/easypanel/projects/`
- El servicio actual está desplegado manualmente via Docker Swarm
- No es necesario modificar la integración actual a menos que se requiera gestión desde UI

## Siguiente paso recomendado

Si deseas gestión desde UI de EasyPanel, la forma más limpia es:
1. Exportar el código a un repositorio Git
2. Agregar el repositorio en EasyPanel como "Git App"
3. EasyPanel construirá y desplegará automáticamente

¿Te gustaría que prepare el código para opción 3 (Git + EasyPanel Git App)?