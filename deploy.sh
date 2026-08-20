#!/bin/bash
set -e

# ============================================
# Script de Deploy — ALANTEK
# Servidor: 192.168.1.43 / alan-tek.com
#
# Uso: sudo ./deploy.sh [--skip-build] [--skip-git]
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/var/www/portfolio"
NGINX_CONF="$SCRIPT_DIR/nginx/portfolio.conf"
SERVER_IP="192.168.1.43"
SKIP_BUILD=false
SKIP_GIT=false

for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --skip-git) SKIP_GIT=true ;;
    esac
done

if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

echo "========================================="
echo "  Deploy ALANTEK"
echo "========================================="

# ── Verificar prerequisitos ──
if ! command -v docker &> /dev/null; then
    echo "Error: Docker no esta instalado."
    exit 1
fi

if ! docker compose version &> /dev/null 2>&1; then
    echo "Error: Docker Compose no esta instalado."
    exit 1
fi

if ! command -v nginx &> /dev/null; then
    echo "Error: nginx no esta instalado. Instalar con: sudo apt install nginx"
    exit 1
fi

# ── Verificar .env ──
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Error: No existe .env en $SCRIPT_DIR"
    echo "Copiar desde .env.prod.example:  cp .env.prod.example .env && nano .env"
    exit 1
fi

# ── [1/7] Git pull ──
echo ""
echo "[1/7] Actualizando codigo..."
if [ "$SKIP_GIT" = true ]; then
    echo "  Saltando git pull (--skip-git)"
elif [ -d "$SCRIPT_DIR/.git" ]; then
    cd "$SCRIPT_DIR"
    git pull --ff-only 2>/dev/null || {
        echo "  git pull fallo, intentando fetch + reset..."
        git fetch origin
        git reset --hard origin/$(git branch --show-current)
    }
    echo "  Codigo actualizado"
else
    echo "  No es un repositorio git, saltando"
fi

# ── [2/7] Build frontend ──
echo ""
echo "[2/7] Build del frontend..."
if [ "$SKIP_BUILD" = true ]; then
    echo "  Saltando build (--skip-build)"
elif [ -d "$SCRIPT_DIR/frontend" ]; then
    cd "$SCRIPT_DIR/frontend"
    if [ ! -d "node_modules" ]; then
        echo "  Instalando dependencias..."
        npm install --production=false 2>&1 | tail -3
    fi
    npx ng build --configuration=production
    echo "  Frontend build completado"
else
    echo "  Directorio frontend/ no encontrado, saltando build"
fi

# ── [3/7] Detectar build output ──
echo ""
echo "[3/7] Detectando build del frontend..."
FRONTEND_SRC=""
for candidate in \
    "$SCRIPT_DIR/frontend-dist" \
    "$SCRIPT_DIR/frontend/dist/portfolio/browser" \
    "$SCRIPT_DIR/frontend/dist/browser" \
    "$SCRIPT_DIR/frontend/dist/frontend/browser"; do
    if [ -f "$candidate/index.html" ]; then
        FRONTEND_SRC="$candidate"
        break
    fi
done

if [ -z "$FRONTEND_SRC" ] || [ ! -f "$FRONTEND_SRC/index.html" ]; then
    echo "Error: No se encontro build del frontend."
    echo "Buscado: frontend-dist/, frontend/dist/portfolio/browser/, frontend/dist/browser/"
    exit 1
fi
echo "  Build encontrado: $FRONTEND_SRC"

# ── [4/7] Deploy frontend a nginx ──
echo ""
echo "[4/7] Desplegando frontend en $DEPLOY_DIR ..."
$SUDO mkdir -p "$DEPLOY_DIR"
$SUDO rm -rf "$DEPLOY_DIR"/*
$SUDO cp -r "$FRONTEND_SRC"/* "$DEPLOY_DIR"/
$SUDO chown -R www-data:www-data "$DEPLOY_DIR"
$SUDO chmod -R 755 "$DEPLOY_DIR"
echo "  Frontend desplegado"

# ── [5/7] Configurar nginx ──
echo ""
echo "[5/7] Configurando nginx..."
if [ -f "$NGINX_CONF" ]; then
    $SUDO cp "$NGINX_CONF" /etc/nginx/sites-available/portfolio
    $SUDO ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
    $SUDO rm -f /etc/nginx/sites-enabled/default
    if $SUDO nginx -t 2>&1; then
        $SUDO systemctl reload nginx
        echo "  nginx configurado y recargado"
    else
        echo "  Error en configuracion de nginx. Revisar: sudo nginx -t"
        exit 1
    fi
else
    echo "  Advertencia: $NGINX_CONF no encontrado, saltando"
fi

# ── [6/7] Deploy backend Docker ──
echo ""
echo "[6/7] Construyendo y levantando backend..."
cd "$SCRIPT_DIR"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# ── [7/7] Health check ──
echo ""
echo "[7/7] Esperando backend..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s "http://127.0.0.1:3000/api/health" 2>/dev/null | grep -q "ok"; then
        echo "  Backend OK!"
        break
    fi
    sleep 3
    WAITED=$((WAITED + 3))
    echo "  Esperando... ($WAITED/${MAX_WAIT}s)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo ""
    echo "ERROR: Backend no respondio en ${MAX_WAIT}s."
    echo "Logs:"
    docker compose -f docker-compose.prod.yml logs --tail=30
    exit 1
fi

echo ""
echo "========================================="
echo "  Deploy completado!"
echo "========================================="
echo ""
echo "  Frontend: http://$SERVER_IP/portfolio/"
echo "  Domain:   http://alan-tek.com/portfolio/"
echo "  API:      http://$SERVER_IP/portfolio/api/health"
echo "  API Docs: http://$SERVER_IP/api-docs"
echo ""
echo "  Logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart:  docker compose -f docker-compose.prod.yml restart"
echo "  Stop:     docker compose -f docker-compose.prod.yml down"
echo ""
