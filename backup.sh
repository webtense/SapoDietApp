#!/bin/bash
# SapoFit Backup Script (PostgreSQL)
# Ubicación: /opt/sapofit/backup.sh
# Uso: chmod +x backup.sh && ./backup.sh

BACKUP_DIR="/opt/sapofit/backups"
DATE=$(date +%Y%m%d_%H%M%S)

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL no configurado"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "=== SapoFit Backup - $DATE ==="

pg_dump "$DATABASE_URL" > "$BACKUP_DIR/sapofit_db_$DATE.sql"

if [ $? -eq 0 ]; then
  echo "Backup completado: sapofit_db_$DATE.sql"

  # Mantener solo los últimos 7 backups
  ls -1t "$BACKUP_DIR"/sapofit_db_*.sql | tail -n +8 | xargs -r rm
  echo "Backups antiguos eliminados (mantenemos 7)"
else
  echo "ERROR: Fallo en el backup"
  exit 1
fi
