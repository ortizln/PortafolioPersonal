#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  migrate-complete.sh — Migración completa ALANTEK
#
#  Migra datos DevBlackSheep al modelo corporativo + seed completo.
#  Idempotente: seguro ejecutar múltiples veces.
#
#  Uso:
#    ./migrate-complete.sh                   # ejecución normal
#    ./migrate-complete.sh --dry-run         # solo muestra qué haría
#    ./migrate-complete.sh --skip-backup     # salta backup
#    ./migrate-complete.sh --reset           # borra datos corporativos antes
#    ./migrate-complete.sh --seed-only       # solo ejecuta el seed
#    ./migrate-complete.sh --env=production  # usa .env del directorio padre
#    ./migrate-complete.sh --help            # muestra ayuda
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ─── Defaults ──────────────────────────────────────────────
DRY_RUN=false
SKIP_BACKUP=false
RESET=false
SEED_ONLY=false
ENV_CHOICE=""
SHOW_HELP=false

# ─── Parse args ────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --dry-run)     DRY_RUN=true ;;
    --skip-backup) SKIP_BACKUP=true ;;
    --reset)       RESET=true ;;
    --seed-only)   SEED_ONLY=true ;;
    --env=*)       ENV_CHOICE="${arg#*=}" ;;
    --help|-h)     SHOW_HELP=true ;;
    *) echo "Argumento desconocido: $arg"; exit 1 ;;
  esac
done

if $SHOW_HELP; then
  echo "Uso: $0 [opciones]"
  echo ""
  echo "Opciones:"
  echo "  --dry-run         Solo muestra qué haría, sin ejecutar cambios"
  echo "  --skip-backup     No crea backup antes de la migración"
  echo "  --reset           Borra datos corporativos antes del seed"
  echo "  --seed-only       Solo ejecuta el seed (migraciones ya aplicadas)"
  echo "  --env=production  Usa DATABASE_URL de producción"
  echo "  --help, -h        Muestra esta ayuda"
  exit 0
fi

# ─── Colors ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ─── Locate project ───────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$ROOT_DIR/backend"
PRISMA_DIR="$BACKEND_DIR/prisma"

if [[ ! -d "$BACKEND_DIR" ]]; then
  err "No se encontró directorio backend en $ROOT_DIR"
  exit 1
fi

if [[ ! -f "$PRISMA_DIR/schema.prisma" ]]; then
  err "No se encontró schema.prisma en $PRISMA_DIR"
  exit 1
fi

# ─── Load .env ─────────────────────────────────────────────
ENV_FILE=""
if [[ -n "$ENV_CHOICE" ]]; then
  if [[ -f "$ROOT_DIR/.env.$ENV_CHOICE" ]]; then
    ENV_FILE="$ROOT_DIR/.env.$ENV_CHOICE"
  elif [[ -f "$BACKEND_DIR/.env.$ENV_CHOICE" ]]; then
    ENV_FILE="$BACKEND_DIR/.env.$ENV_CHOICE"
  fi
fi

if [[ -z "$ENV_FILE" ]]; then
  for candidate in "$ROOT_DIR/.env" "$BACKEND_DIR/.env" "$ROOT_DIR/.env.local" "$BACKEND_DIR/.env.local"; do
    if [[ -f "$candidate" ]]; then
      ENV_FILE="$candidate"
      break
    fi
  done
fi

if [[ -z "$ENV_FILE" ]]; then
  err "No se encontró archivo .env (buscado en $ROOT_DIR y $BACKEND_DIR)."
  err "Crea uno desde .env.example o define DATABASE_URL manualmente."
  exit 1
fi

info "Usando .env: $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  err "DATABASE_URL no está definido en $ENV_FILE"
  exit 1
fi

# ─── Parse DATABASE_URL ────────────────────────────────────
DB_URL_RE='^postgres(ql)?://([^:]+):([^@]+)@([^:/]+):([0-9]+)/([^?]+)'
if [[ $DATABASE_URL =~ $DB_URL_RE ]]; then
  DB_USER="${BASH_REMATCH[2]}"
  DB_PASS="${BASH_REMATCH[3]}"
  DB_HOST="${BASH_REMATCH[4]}"
  DB_PORT="${BASH_REMATCH[5]}"
  DB_NAME="${BASH_REMATCH[6]}"
else
  err "No se pudo interpretar DATABASE_URL"
  exit 1
fi

info "Base de datos: $DB_NAME en $DB_HOST:$DB_PORT (user: $DB_USER)"

# ─── Banner ────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  ALANTEK — Migración Completa de Base de Datos${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Base de datos:  $DB_NAME"
echo "  Host:           $DB_HOST:$DB_PORT"
echo "  Modo:           $([ "$DRY_RUN" = true ] && echo 'DRY-RUN' || echo 'ejecución real')"
echo "  Backup:         $([ "$SKIP_BACKUP" = true ] && echo 'omitido' || echo 'sí')"
echo "  Reset:          $([ "$RESET" = true ] && echo 'sí' || echo 'no')"
echo ""

if $DRY_RUN; then
  warn "Modo DRY-RUN: no se realizarán cambios."
  echo ""
fi

# ─── Preflight checks ─────────────────────────────────────
info "Verificando prerequisitos..."

# PostgreSQL reachable
if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
  err "No se puede conectar a PostgreSQL en $DB_HOST:$DB_PORT"
  exit 1
fi
ok "PostgreSQL conectado"

# psql available
if ! command -v psql &>/dev/null; then
  err "psql no está instalado. Instala postgresql-client."
  exit 1
fi
ok "psql disponible"

# Node.js available
if ! command -v node &>/dev/null; then
  err "Node.js no está instalado."
  exit 1
fi
ok "Node.js $(node --version)"

# node_modules
if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  warn "node_modules no existe, ejecutando npm install..."
  (cd "$BACKEND_DIR" && npm install --production)
fi
ok "Dependencias instaladas"

# ─── Step 1: Backup ────────────────────────────────────────
if ! $SKIP_BACKUP && ! $DRY_RUN; then
  echo ""
  info "[1/5] Creando backup previo..."
  BACKUP_DIR="/var/backups/portfolio"
  TS="$(date +%Y%m%d_%H%M%S)"
  BACKUP_TARGET="$BACKUP_DIR/$TS"

  if command -v pg_dump &>/dev/null; then
    mkdir -p "$BACKUP_TARGET"
    PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" \
      | gzip > "$BACKUP_TARGET/database_pre_migration.sql.gz"
    ok "Backup: $BACKUP_TARGET/database_pre_migration.sql.gz ($(du -h "$BACKUP_TARGET/database_pre_migration.sql.gz" | cut -f1))"
  else
    warn "pg_dump no encontrado, saltando backup de DB."
    warn "IMPORTANTE: haz un backup manual antes de continuar."
  fi
else
  info "[1/5] Backup: omitido"
fi

# ─── Step 2: Prisma migrate ───────────────────────────────
echo ""
if $SEED_ONLY; then
  info "[2/5] Migraciones: omitido (--seed-only)"
else
  info "[2/5] Aplicando migraciones de esquema..."
  if $DRY_RUN; then
    info "  (dry-run: se ejecutaría prisma migrate deploy)"
  else
    (cd "$BACKEND_DIR" && npx prisma migrate deploy 2>&1) || {
      err "prisma migrate deploy falló"
      exit 1
    }
    ok "Migraciones aplicadas"
  fi
fi

# ─── Step 3: Prisma generate ──────────────────────────────
echo ""
info "[3/5] Generando Prisma Client..."
if $DRY_RUN; then
  info "  (dry-run: se ejecutaría prisma generate)"
else
  (cd "$BACKEND_DIR" && npx prisma generate 2>&1) || {
    err "prisma generate falló"
    exit 1
  }
  ok "Prisma Client generado"
fi

# ─── Step 4: Seed completo ────────────────────────────────
echo ""
info "[4/5] Ejecutando seed completo..."
SEED_ARGS=""
if $DRY_RUN; then
  SEED_ARGS="--dry-run"
elif $RESET; then
  SEED_ARGS="--reset"
fi

if $DRY_RUN; then
  info "  (dry-run: se ejecutaría seed-complete.js $SEED_ARGS)"
else
  (cd "$BACKEND_DIR" && node prisma/seed-complete.js $SEED_ARGS 2>&1) || {
    err "seed-complete.js falló"
    exit 1
  }
  ok "Seed completado"
fi

# ─── Step 5: Verificación ─────────────────────────────────
echo ""
info "[5/5] Verificando datos..."

if $DRY_RUN; then
  info "  (dry-run: se ejecutaría verificación)"
else
  echo ""
  echo "  ┌─────────────────────────────────────────┐"
  echo "  │  Resumen de la base de datos             │"
  echo "  └─────────────────────────────────────────┘"

  TABLES=(
    "users:Usuarios"
    "profiles:Perfiles"
    "roles:Roles RBAC"
    "permissions:Permisos"
    "companies:Empresa"
    "team_members:Equipo"
    "technologies:Tecnologías"
    "services:Servicios"
    "clients:Clientes"
    "testimonials:Testimonios"
    "projects:Proyectos"
    "categories:Categorías"
    "posts:Blog Posts"
    "settings:Settings"
    "page_views:Page Views"
    "contact_messages:Mensajes"
    "experiences:Experiencias"
    "educations:Educación"
    "certifications:Certificaciones"
    "skills:Skills"
    "languages:Idiomas"
    "social_links:Social Links"
  )

  for entry in "${TABLES[@]}"; do
    table="${entry%%:*}"
    label="${entry#*:}"
    count=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM $table" 2>/dev/null || echo "?")
    printf "  %-20s %s\n" "$label" "$count"
  done
fi

# ─── Done ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ¡Migración completada exitosamente!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Siguientes pasos:"
echo "    1. Abre /admin/company para revisar la info de ALANTEK"
echo "    2. Revisa /admin/team para ajustar miembros del equipo"
echo "    3. Verifica /admin/projects para proyectos"
echo "    4. Verifica los endpoints públicos:"
echo "       curl http://localhost:3000/api/public/company"
echo "       curl http://localhost:3000/api/public/team"
echo ""
echo "  Backup pre-migración: ${BACKUP_TARGET:-omitido}"
echo ""
