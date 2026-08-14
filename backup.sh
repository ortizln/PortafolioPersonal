#!/bin/bash
# ============================================
# Script de Backup - Portafolio Personal / ALANTEK
# Ejecutar EN EL SERVIDOR (Linux), no local.
#
#   sudo chmod +x backup.sh
#   ./backup.sh
#
# Crea: <BACKUP_DIR>/<fecha>/database.sql.gz
#       <BACKUP_DIR>/<fecha>/uploads_<fecha>.tar.gz
#       <BACKUP_DIR>/<fecha>/.env             (secreto: guardar fuera del servidor)
# ============================================
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# ---------- Configuración (ajustar si cambia el stack) ----------
BACKUP_DIR="/var/backups/portfolio"   # directorio destino
POSTGRES_IMAGE="postgres:16-alpine"   # imagen usada para pg_dump vía docker
UPLOADS_VOLUME="backend_uploads"      # volumen de archivos subidos
RETENTION_DAYS=7                      # cuántos backups conservar
# -----------------------------------------------------------------

TS="$(date +%Y%m%d_%H%M%S)"
TARGET="$BACKUP_DIR/$TS"

# Verificar que docker existe (necesario para uploads y pg_dump)
if ! command -v docker &> /dev/null; then
  echo "Error: docker no esta instalado."
  exit 1
fi

# Verificar que existe el contenedor del backend (fuente de DATABASE_URL)
if ! docker inspect portfolio-api &> /dev/null; then
  echo "Error: no se encontro el contenedor 'portfolio-api'."
  echo "Asegurate de que el backend este levantado (docker compose -f docker-compose.prod.yml ps)."
  exit 1
fi

# Obtener DATABASE_URL: primero del .env, si no del contenedor en ejecucion
DATABASE_URL=""
if [ -f "$ENV_FILE" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "No hay .env en la raiz, leyendo DATABASE_URL del contenedor portfolio-api..."
  DATABASE_URL="$(docker inspect portfolio-api --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^DATABASE_URL=' | head -n1 | cut -d= -f2-)"
fi

# Parsear URL: postgres(ql)://usuario:clave@host:puerto/bd?params
DB_URL_RE='^postgres(ql)?://([^:]+):([^@]+)@([^:/]+):([0-9]+)/([^?]+)'
if [[ $DATABASE_URL =~ $DB_URL_RE ]]; then
  DB_USER="${BASH_REMATCH[2]}"
  DB_PASS="${BASH_REMATCH[3]}"
  DB_HOST="${BASH_REMATCH[4]}"
  DB_PORT="${BASH_REMATCH[5]}"
  DB_NAME="${BASH_REMATCH[6]}"
else
  echo "Error: no se pudo interpretar DATABASE_URL."
  echo "El formato esperado es: postgresql://usuario:clave@host:puerto/bd"
  exit 1
fi

mkdir -p "$TARGET"

echo "========================================="
echo "  Backup ${TS}"
echo "  Destino: $TARGET"
echo "========================================="

# ---------- 1. PostgreSQL ----------
echo ""
echo "[1/3] Dump de PostgreSQL ($DB_NAME)..."
if command -v pg_dump &> /dev/null; then
  echo "  Usando pg_dump del sistema."
  PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" \
    | gzip > "$TARGET/database.sql.gz"
else
  echo "  pg_dump no instalado, usando imagen docker $POSTGRES_IMAGE."
  docker run --rm \
    -e PGPASSWORD="$DB_PASS" \
    "$POSTGRES_IMAGE" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" \
    | gzip > "$TARGET/database.sql.gz"
fi

if [ -s "$TARGET/database.sql.gz" ]; then
  echo "  OK ($(du -h "$TARGET/database.sql.gz" | cut -f1))"
else
  echo "Error: el dump de la base quedo vacio. Revisar DATABASE_URL."
  rm -rf "$TARGET"
  exit 1
fi

# ---------- 2. Uploads ----------
echo ""
echo "[2/3] Backup de uploads (volumen $UPLOADS_VOLUME)..."
docker run --rm \
  -v "$UPLOADS_VOLUME:/data:ro" \
  -v "$TARGET:/backup" \
  alpine:3 tar czf "/backup/uploads_${TS}.tar.gz" -C /data .
echo "  OK ($(du -h "$TARGET"/uploads_*.tar.gz | cut -f1))"

# ---------- 3. .env (secretos, opcional) ----------
if [ -f "$ENV_FILE" ]; then
  echo ""
  echo "[3/3] Copia de .env..."
  cp "$ENV_FILE" "$TARGET/.env"
  echo "  OK"
else
  echo ""
  echo "[3/3] Sin .env en la raiz, se omite su copia."
  echo "  Los secretos reales quedan en el contenedor portfolio-api."
fi

# ---------- Retención ----------
echo ""
echo "Limpiando backups de mas de ${RETENTION_DAYS} dias..."
DELETED=0
for d in "$BACKUP_DIR"/20*; do
  [ -d "$d" ] || continue
  if [ -n "$(find "$d" -maxdepth 0 -mtime +"$RETENTION_DAYS")" ]; then
    echo "  Eliminando: $d"
    rm -rf "$d"
    DELETED=1
  fi
done
[ "$DELETED" -eq 0 ] && echo "  Nada que limpiar."

echo ""
echo "========================================="
echo "  Backup completado!"
echo "========================================="
echo ""
echo "  Base de datos:  $TARGET/database.sql.gz"
echo "  Uploads:        $TARGET/uploads_${TS}.tar.gz"
if [ -f "$ENV_FILE" ]; then
  echo "  Variables:      $TARGET/.env  (SEGRETO)"
else
  echo "  Variables:      (no habia .env en la raiz; los secretos estan en el contenedor)"
fi
echo ""
echo "  IMPORTANTE: copia el directorio $TARGET"
echo "  a otro disco o nube. No lo dejes solo en el servidor."
echo ""
echo "  Restaurar base:"
echo "    gunzip -c database.sql.gz | PGPASSWORD='...' psql -h localhost -U postgres portfolio_db"
echo ""
