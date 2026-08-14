#!/bin/bash
# ============================================
# Genera el .env de la raiz a partir de las
# variables reales del contenedor portfolio-api
# (necesario para deploy.sh con los nuevos
# secretos externos). Ejecutar EN EL SERVIDOR.
#
#   chmod +x create-env.sh
#   ./create-env.sh
#   cat .env      # revisar antes de desplegar
#   ./deploy.sh
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
CONTAINER="portfolio-api"

if ! docker inspect "$CONTAINER" &> /dev/null; then
  echo "Error: no se encontro el contenedor '$CONTAINER'."
  echo "Asegurate de que el backend este arriba."
  exit 1
fi

get_env() {
  docker inspect "$CONTAINER" \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | grep "^$1=" | head -n1 | cut -d= -f2-
}

DATABASE_URL="$(get_env DATABASE_URL)"
JWT_SECRET="$(get_env JWT_SECRET)"
JWT_REFRESH_SECRET="$(get_env JWT_REFRESH_SECRET)"
CORS_ORIGIN="$(get_env CORS_ORIGIN)"
RATE_LIMIT_WINDOW="$(get_env RATE_LIMIT_WINDOW)"
RATE_LIMIT_MAX="$(get_env RATE_LIMIT_MAX)"
MAX_FILE_SIZE="$(get_env MAX_FILE_SIZE)"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: el contenedor '$CONTAINER' no expone DATABASE_URL."
  exit 1
fi

printf '# Generado por create-env.sh a partir del contenedor %s\n' "$CONTAINER" > "$ENV_FILE"
printf 'NODE_ENV=production\n' >> "$ENV_FILE"
printf 'DATABASE_URL=%s\n' "$DATABASE_URL" >> "$ENV_FILE"
printf 'JWT_SECRET=%s\n' "$JWT_SECRET" >> "$ENV_FILE"
printf 'JWT_REFRESH_SECRET=%s\n' "$JWT_REFRESH_SECRET" >> "$ENV_FILE"
printf 'CORS_ORIGIN=%s\n' "$CORS_ORIGIN" >> "$ENV_FILE"
printf 'RATE_LIMIT_WINDOW=%s\n' "${RATE_LIMIT_WINDOW:-15}" >> "$ENV_FILE"
printf 'RATE_LIMIT_MAX=%s\n' "${RATE_LIMIT_MAX:-100}" >> "$ENV_FILE"
printf 'MAX_FILE_SIZE=%s\n' "${MAX_FILE_SIZE:-20971520}" >> "$ENV_FILE"

chmod 600 "$ENV_FILE"

echo ""
echo "OK: $ENV_FILE creado a partir del contenedor '$CONTAINER'."
echo ""
echo "Revisa el contenido (NO lo compartas):"
echo "  cat $ENV_FILE"
echo ""
echo "Si quieres rotar los JWT, edita ese archivo y luego:"
echo "  ./deploy.sh"
