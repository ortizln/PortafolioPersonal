#!/usr/bin/env bash
# Migra la base de datos desde el modelo DevBlackSheep al modelo corporativo ALANTEK.
# Uso: ./migrate-corporate.sh
# Requiere: PostgreSQL activo y backend/.env con DATABASE_URL.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ -f "${BACKEND_DIR}/.env" ]]; then
    ENV_FILE="${BACKEND_DIR}/.env"
  else
    echo "ERROR: No se encontró .env (buscado en ${ROOT_DIR} y ${BACKEND_DIR})." >&2
    exit 1
  fi
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL no está definido en ${ENV_FILE}." >&2
  exit 1
fi

echo "==> Aplicando migraciones de esquema (prisma migrate deploy)"
(
  cd "${BACKEND_DIR}"
  npx prisma migrate deploy
  npx prisma generate
)

echo "==> Migrando datos al modelo corporativo"
(
  cd "${BACKEND_DIR}"
  node scripts/migrate-corporate.js
)

echo
echo "Migración completada."
echo "Próximos pasos sugeridos:"
echo "  1. Revisa /admin/company para completar la información de marca."
echo "  2. Revisa /admin/team y vincula experiencias/educación/certificaciones por miembro."
echo "  3. Verifica los endpoints públicos: /api/public/company, /api/public/team."
