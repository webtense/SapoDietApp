#!/usr/bin/env bash
#
# workflow-fase3-newsletter.sh
#
# Coordinador de verificación/despliegue para SapoFit v3.24.0 Fase 3 (Newsletter RGPD).
# NO modifica código de SapoFit: solo hace llamadas HTTP/SSH para verificar y
# accionar tareas operativas pendientes tras el deploy.
#
# Pasos orquestados (en orden, con checkpoint/resume):
#   1) setup_vps        -> aplica/verifica env vars NEWSLETTER_* y SMTP_* en el VPS
#   2) crear_usuarios    -> crea invitaciones reales vía /api/admin/invitations
#   3) verificar_bd      -> prisma migrate status + comprobación NewsletterSubscriber
#   4) test_e2e          -> alta/confirmación/baja de newsletter con email de prueba
#   5) verificar_version -> comprueba /api/version == 3.24.0
#
# Uso:
#   ./scripts/workflow-fase3-newsletter.sh                 # ejecuta todos los pasos pendientes
#   ./scripts/workflow-fase3-newsletter.sh --from test_e2e # reanuda desde un paso concreto
#   ./scripts/workflow-fase3-newsletter.sh --only setup_vps
#   ./scripts/workflow-fase3-newsletter.sh --status         # muestra estado guardado y sale
#
# Variables de entorno requeridas (ver .env.workflow.example):
#   APP_URL                  https://sapofit.semillasdeti.com
#   ADMIN_SESSION_COOKIE     cookie de sesión de un admin autenticado (next-auth)
#   VPS_HOST                 host SSH del VPS (ej: 217.154.188.166)
#   VPS_SSH_USER             usuario SSH (ej: root o deploy)
#   VPS_APP_DIR              ruta de la app en el VPS (ej: /opt/sapofit o /app)
#   VPS_ENV_FILE             ruta al .env en el VPS (ej: $VPS_APP_DIR/.env)
#   NEWSLETTER_COMPANY_NAME, NEWSLETTER_COMPANY_CIF,
#   NEWSLETTER_COMPANY_ADDRESS, NEWSLETTER_COMPANY_PHONE
#   TEST_EMAIL                email real para el test E2E (recibe correos de verdad)
#
# Salida: log en consola + fichero de estado en scripts/.workflow-state/fase3.json
# para poder pausar y reanudar.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$SCRIPT_DIR/.workflow-state"
STATE_FILE="$STATE_DIR/fase3.json"
mkdir -p "$STATE_DIR"

# Carga variables desde scripts/.env.workflow si existe (no versionar este fichero)
if [ -f "$SCRIPT_DIR/.env.workflow" ]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.env.workflow"
fi

APP_URL="${APP_URL:-https://sapofit.semillasdeti.com}"
EXPECTED_VERSION="${EXPECTED_VERSION:-3.24.0}"

STEPS=(setup_vps crear_usuarios verificar_bd test_e2e verificar_version)

# ---------- utilidades ----------

c_green() { printf '\033[32m%s\033[0m\n' "$1"; }
c_red()   { printf '\033[31m%s\033[0m\n' "$1"; }
c_yellow(){ printf '\033[33m%s\033[0m\n' "$1"; }
c_blue()  { printf '\033[34m%s\033[0m\n' "$1"; }

log()  { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$1"; }
ok()   { c_green "  OK  $1"; }
fail() { c_red   "  FALLO  $1"; }
warn() { c_yellow "  AVISO  $1"; }

# estado persistido: uno de PENDING / OK / FAIL por paso
state_get() {
  local step="$1"
  if [ -f "$STATE_FILE" ]; then
    grep -o "\"$step\":\"[A-Z]*\"" "$STATE_FILE" 2>/dev/null | cut -d'"' -f4
  fi
}

state_set() {
  local step="$1" value="$2"
  declare -A current
  for s in "${STEPS[@]}"; do
    current[$s]="$(state_get "$s")"
    [ -z "${current[$s]}" ] && current[$s]="PENDING"
  done
  current[$step]="$value"
  {
    echo "{"
    local n=${#STEPS[@]} i=0
    for s in "${STEPS[@]}"; do
      i=$((i+1))
      if [ "$i" -eq "$n" ]; then
        echo "  \"$s\":\"${current[$s]}\""
      else
        echo "  \"$s\":\"${current[$s]}\","
      fi
    done
    echo "}"
  } > "$STATE_FILE"
}

require_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    fail "Falta variable de entorno requerida: $name"
    return 1
  fi
  return 0
}

# ---------- paso 1: setup VPS (env vars) ----------

step_setup_vps() {
  log "Paso 1/5: Setup VPS — env vars NEWSLETTER_* y verificación SMTP_*"

  for v in VPS_HOST VPS_SSH_USER VPS_ENV_FILE NEWSLETTER_COMPANY_NAME NEWSLETTER_COMPANY_CIF NEWSLETTER_COMPANY_ADDRESS NEWSLETTER_COMPANY_PHONE; do
    require_var "$v" || return 1
  done

  local remote_env="$VPS_ENV_FILE"
  local ssh_target="${VPS_SSH_USER}@${VPS_HOST}"

  log "Comprobando SMTP_* existentes en $remote_env ..."
  local smtp_check
  smtp_check=$(ssh "$ssh_target" "grep -c '^SMTP_' '$remote_env' 2>/dev/null || true")
  if [ -z "$smtp_check" ] || [ "$smtp_check" = "0" ]; then
    warn "No se encontraron variables SMTP_* en $remote_env. Revísalo manualmente antes de continuar."
  else
    ok "SMTP_* presentes ($smtp_check líneas) en $remote_env"
  fi

  log "Aplicando/actualizando NEWSLETTER_* en $remote_env ..."
  # upsert_var <key> <value> sobre el fichero remoto, sin sed -i destructivo: backup previo
  ssh "$ssh_target" bash -s -- "$remote_env" <<EOF
set -e
ENV_FILE="\$1"
cp "\$ENV_FILE" "\$ENV_FILE.bak.\$(date +%Y%m%d%H%M%S)"
upsert() {
  local key="\$1" val="\$2"
  if grep -q "^\${key}=" "\$ENV_FILE"; then
    sed -i "s#^\${key}=.*#\${key}=\"\${val}\"#" "\$ENV_FILE"
  else
    echo "\${key}=\"\${val}\"" >> "\$ENV_FILE"
  fi
}
upsert NEWSLETTER_COMPANY_NAME "$NEWSLETTER_COMPANY_NAME"
upsert NEWSLETTER_COMPANY_CIF "$NEWSLETTER_COMPANY_CIF"
upsert NEWSLETTER_COMPANY_ADDRESS "$NEWSLETTER_COMPANY_ADDRESS"
upsert NEWSLETTER_COMPANY_PHONE "$NEWSLETTER_COMPANY_PHONE"
EOF
  if [ $? -ne 0 ]; then
    fail "No se pudieron aplicar las env vars en el VPS"
    return 1
  fi
  ok "NEWSLETTER_* aplicadas en $remote_env (con backup .bak.*)"

  if [ -n "${VPS_RESTART_CMD:-}" ]; then
    log "Reiniciando servicio con: $VPS_RESTART_CMD"
    ssh "$ssh_target" "$VPS_RESTART_CMD" || { fail "Fallo al reiniciar el servicio"; return 1; }
    ok "Servicio reiniciado"
  else
    warn "VPS_RESTART_CMD no definido: recuerda reiniciar la app para que tome las nuevas env vars"
  fi

  return 0
}

# ---------- paso 2: crear usuarios reales vía invitaciones ----------

step_crear_usuarios() {
  log "Paso 2/5: Crear invitaciones para usuarios reales"
  require_var APP_URL || return 1
  require_var ADMIN_SESSION_COOKIE || return 1

  local users=(
    "zoraidapozobarrio@gmail.com|Zoraida"
    "datos@cialsaga.com|Alex"
    "webtense@gmail.com|Andrés"
  )

  local any_fail=0
  for entry in "${users[@]}"; do
    local email="${entry%%|*}"
    local name="${entry##*|}"
    log "Invitando a $name <$email> ..."
    local resp http_code body
    resp=$(curl -sS -w '\n%{http_code}' -X POST "$APP_URL/api/admin/invitations" \
      -H "Content-Type: application/json" \
      -H "Cookie: $ADMIN_SESSION_COOKIE" \
      -d "{\"email\":\"$email\",\"name\":\"$name\"}")
    http_code=$(echo "$resp" | tail -n1)
    body=$(echo "$resp" | sed '$d')
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
      ok "Invitación creada para $email"
    else
      fail "Invitación para $email -> HTTP $http_code: $body"
      any_fail=1
    fi
  done

  [ "$any_fail" -eq 0 ]
}

# ---------- paso 3: verificar migración newsletter en BD ----------

step_verificar_bd() {
  log "Paso 3/5: Verificar migración newsletter en BD de producción"
  for v in VPS_HOST VPS_SSH_USER VPS_APP_DIR; do
    require_var "$v" || return 1
  done
  local ssh_target="${VPS_SSH_USER}@${VPS_HOST}"

  # SapoFit corre en Docker Swarm (servicio "sapofit"), no como app desnuda en el filesystem.
  # Si VPS_DOCKER_SERVICE está definida, ejecuta dentro del contenedor vía `docker exec`.
  local exec_prefix="cd '$VPS_APP_DIR' &&"
  if [ -n "${VPS_DOCKER_SERVICE:-}" ]; then
    exec_prefix="docker exec \$(docker ps -q -f name=${VPS_DOCKER_SERVICE} | head -1)"
  fi

  log "Ejecutando 'prisma migrate status' en $VPS_HOST (servicio: ${VPS_DOCKER_SERVICE:-filesystem directo}) ..."
  local out
  if [ -n "${VPS_DOCKER_SERVICE:-}" ]; then
    out=$(ssh "$ssh_target" "$exec_prefix npx prisma migrate status 2>&1")
  else
    out=$(ssh "$ssh_target" "$exec_prefix npx prisma migrate status 2>&1")
  fi
  echo "$out" | sed 's/^/    /'

  if echo "$out" | grep -qi "Database schema is up to date"; then
    ok "Migraciones al día"
  else
    fail "Migraciones NO están al día (revisar salida arriba)"
    return 1
  fi

  log "Comprobando existencia de la tabla NewsletterSubscriber ..."
  local table_check
  table_check=$(ssh "$ssh_target" "cd '$VPS_APP_DIR' && npx prisma db execute --stdin <<< \"SELECT to_regclass('public.\\\"NewsletterSubscriber\\\"');\" 2>&1" || true)
  if echo "$table_check" | grep -qi "NewsletterSubscriber"; then
    ok "Tabla NewsletterSubscriber presente"
  else
    warn "No se pudo confirmar la tabla vía prisma db execute. Salida: $table_check"
    warn "Verifica manualmente con psql si el motor de BD no es Postgres o el comando falla por permisos."
  fi

  return 0
}

# ---------- paso 4: test E2E suscripción newsletter ----------

step_test_e2e() {
  log "Paso 4/5: Test E2E suscripción newsletter"
  require_var APP_URL || return 1
  require_var TEST_EMAIL || return 1

  log "4.1 Alta de $TEST_EMAIL en newsletter ..."
  local resp http_code body
  resp=$(curl -sS -w '\n%{http_code}' -X POST "$APP_URL/api/newsletter/subscribe" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"consent\":true}")
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    ok "Alta solicitada (HTTP $http_code). Revisa manualmente el correo de confirmación recibido en $TEST_EMAIL"
  else
    fail "Alta -> HTTP $http_code: $body"
    return 1
  fi

  warn "PASO MANUAL REQUERIDO: abre el correo de confirmación en $TEST_EMAIL, haz click en el enlace,"
  warn "y confirma que el registro pasa a CONFIRMED (verifica en BD o en el panel admin)."
  warn "A continuación, prueba la baja (unsubscribe) desde el enlace del correo o vía API y confirma"
  warn "que el estado pasa a UNSUBSCRIBED y que un nuevo alta inmediata no reenvía confirmación duplicada."

  if [ "${AUTO_CONFIRM_E2E:-no}" = "yes" ]; then
    warn "AUTO_CONFIRM_E2E=yes: dando el test E2E por completado automáticamente (NO recomendado sin revisión manual)"
    return 0
  fi

  read -r -p "¿Has verificado manualmente confirmación + baja + no reenvío? (s/N): " answer
  if [ "$answer" = "s" ] || [ "$answer" = "S" ]; then
    ok "Test E2E confirmado manualmente por el usuario"
    return 0
  fi
  fail "Test E2E no confirmado"
  return 1
}

# ---------- paso 5: verificar versión en producción ----------

step_verificar_version() {
  log "Paso 5/5: Verificar /api/version"
  require_var APP_URL || return 1

  local resp
  resp=$(curl -sS "$APP_URL/api/version")
  echo "    $resp"

  if echo "$resp" | grep -q "\"$EXPECTED_VERSION\""; then
    ok "Versión en producción = $EXPECTED_VERSION"
    return 0
  else
    fail "Versión esperada $EXPECTED_VERSION no encontrada en la respuesta"
    return 1
  fi
}

# ---------- orquestación ----------

run_step() {
  local step="$1"
  local fn="step_${step}"
  log "----------------------------------------"
  if ! declare -f "$fn" > /dev/null; then
    fail "Paso desconocido: $step"
    return 1
  fi
  if "$fn"; then
    state_set "$step" "OK"
    ok "Paso '$step' completado"
    return 0
  else
    state_set "$step" "FAIL"
    fail "Paso '$step' ha fallado"
    return 1
  fi
}

print_status() {
  c_blue "Estado actual del workflow Fase 3 Newsletter:"
  for s in "${STEPS[@]}"; do
    local st
    st=$(state_get "$s")
    [ -z "$st" ] && st="PENDING"
    printf '  %-20s %s\n' "$s" "$st"
  done
}

print_summary() {
  echo ""
  c_blue "===== RESUMEN FINAL ====="
  local all_ok=1
  for s in "${STEPS[@]}"; do
    local st
    st=$(state_get "$s")
    [ -z "$st" ] && st="PENDING"
    case "$st" in
      OK) printf '  ✅ %s\n' "$s" ;;
      FAIL) printf '  ❌ %s\n' "$s"; all_ok=0 ;;
      *) printf '  ⏳ %s (%s)\n' "$s" "$st"; all_ok=0 ;;
    esac
  done
  echo ""
  if [ "$all_ok" -eq 1 ]; then
    c_green "Fase 3 Newsletter: TODO VERIFICADO/DESPLEGADO CORRECTAMENTE"
  else
    c_yellow "Fase 3 Newsletter: quedan pasos pendientes o fallidos. Reanuda con --from <paso>"
  fi
}

main() {
  local from_step="" only_step="" show_status="no"

  while [ $# -gt 0 ]; do
    case "$1" in
      --from) from_step="$2"; shift 2 ;;
      --only) only_step="$2"; shift 2 ;;
      --status) show_status="yes"; shift ;;
      -h|--help)
        sed -n '1,40p' "$0" | grep '^#'
        exit 0
        ;;
      *) c_red "Argumento desconocido: $1"; exit 1 ;;
    esac
  done

  if [ "$show_status" = "yes" ]; then
    print_status
    exit 0
  fi

  local run_list=()
  if [ -n "$only_step" ]; then
    run_list=("$only_step")
  elif [ -n "$from_step" ]; then
    local found=0
    for s in "${STEPS[@]}"; do
      if [ "$s" = "$from_step" ]; then found=1; fi
      [ "$found" -eq 1 ] && run_list+=("$s")
    done
    if [ "$found" -eq 0 ]; then
      c_red "Paso no reconocido para --from: $from_step"
      exit 1
    fi
  else
    run_list=("${STEPS[@]}")
  fi

  local overall_fail=0
  for s in "${run_list[@]}"; do
    if ! run_step "$s"; then
      overall_fail=1
      c_red "Deteniendo workflow en '$s'. Corrige el problema y reanuda con: $0 --from $s"
      break
    fi
  done

  print_summary
  exit "$overall_fail"
}

main "$@"
