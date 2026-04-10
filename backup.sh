#!/bin/bash
# SapoFit Backup Script
# Ubicación: /opt/sapofit/backup.sh
# Uso: chmod +x backup.sh && ./backup.sh

BACKUP_DIR="/opt/sapofit/backups"
DATE=$(date +%Y%m%d_%H%M%S)
SOURCE_VOLUME="sapofit_prisma"
CONTAINER_NAME="sapofit_backup"

mkdir -p "$BACKUP_DIR"

echo "=== SapoFit Backup - $DATE ==="

docker run --rm \
  -v sapofit_prisma:/source \
  -v "$BACKUP_DIR:/backup" \
  alpine:latest \
  sh -c "cp /source/dev.db /backup/sapofit_db_$DATE.db"

if [ $? -eq 0 ]; then
  echo "Backup completado: sapofit_db_$DATE.db"
  
  # Mantener solo los últimos 7 backups
  ls -1t "$BACKUP_DIR"/sapofit_db_*.db | tail -n +8 | xargs -r rm
  echo "Backups antiguos eliminados (mantenemos 7)"
else
  echo "ERROR: Fallo en el backup"
  exit 1
fi