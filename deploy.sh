#!/bin/bash
set -e

# ============================================
# Script de Deploy — ALANTEK
# Servidor: 192.168.1.43 / alan-tek.com
#
# Uso:
#   sudo ./deploy.sh              — Deploy completo (git pull + build + deploy)
#   sudo ./deploy.sh --clean      — Deploy + limpiar caché nginx y datos viejos
#   sudo ./deploy.sh --skip-build — No rebuild frontend
#   sudo ./deploy.sh --skip-git   — No hacer git pull
#   sudo ./deploy.sh --skip-backend — No rebuild/restart backend Docker
#   sudo ./deploy.sh --only-frontend — Solo deploy frontend (sin backend)
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/var/www/portfolio"
NGINX_CONF="$SCRIPT_DIR/nginx/portfolio.conf"
SERVER_IP="192.168.1.43"
SKIP_BUILD=false
SKIP_GIT=false
SKIP_BACKEND=false
ONLY_FRONTEND=false
CLEAN=false

for arg in "$@"; do
    case $arg in
        --skip-build)     SKIP_BUILD=true ;;
        --skip-git)       SKIP_GIT=true ;;
        --skip-backend)   SKIP_BACKEND=true ;;
        --only-frontend)  ONLY_FRONTEND=true ;;
        --clean)          CLEAN=true ;;
        --help|-h)
            echo "Uso: sudo ./deploy.sh [--clean] [--skip-build] [--skip-git] [--skip-backend] [--only-frontend]"
            exit 0
            ;;
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
if [ "$CLEAN" = true ]; then
    echo "  *** MODO LIMPIEZA ACTIVADA ***"
fi
echo ""

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

if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Error: No existe .env en $SCRIPT_DIR"
    echo "Copiar desde .env.prod.example:  cp .env.prod.example .env && nano .env"
    exit 1
fi

# ── [1/8] Git pull ──
echo "[1/8] Actualizando codigo..."
if [ "$SKIP_GIT" = true ]; then
    echo "  Saltando git pull (--skip-git)"
elif [ -d "$SCRIPT_DIR/.git" ]; then
    cd "$SCRIPT_DIR"
    git pull --ff-only 2>/dev/null || {
        echo "  git pull fallo, intentando fetch + reset..."
        git fetch origin
        git reset --hard origin/$(git branch --show-current)
    }
    echo "  Codigo actualizado: $(git log --oneline -1)"
else
    echo "  No es repositorio git, saltando"
fi

# ── [2/8] Build frontend ──
echo ""
echo "[2/8] Build del frontend..."
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
    echo "  Directorio frontend/ no encontrado, saltando"
fi

# ── [3/8] Detectar build output ──
echo ""
echo "[3/8] Detectando build del frontend..."
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

FILE_COUNT=$(find "$FRONTEND_SRC" -type f | wc -l)
echo "  Build: $FRONTEND_SRC ($FILE_COUNT archivos)"

# ── [4/8] Deploy frontend a nginx ──
echo ""
echo "[4/8] Desplegando frontend en $DEPLOY_DIR ..."
$SUDO mkdir -p "$DEPLOY_DIR"

if [ "$CLEAN" = true ]; then
    echo "  Limpiando version anterior..."
    $SUDO rm -rf "$DEPLOY_DIR"/*
else
    # Solo limpiar archivos .js y .css (los hash viejos)
    $SUDO find "$DEPLOY_DIR" -name "*.js" -mtime +0 -delete 2>/dev/null || true
    $SUDO find "$DEPLOY_DIR" -name "*.css" -mtime +0 -delete 2>/dev/null || true
fi

$SUDO cp -r "$FRONTEND_SRC"/* "$DEPLOY_DIR"/
$SUDO chown -R www-data:www-data "$DEPLOY_DIR"
$SUDO chmod -R 755 "$DEPLOY_DIR"
echo "  Frontend desplegado"

# ── [5/8] Configurar nginx ──
echo ""
echo "[5/8] Configurando nginx..."
if [ -f "$NGINX_CONF" ]; then
    $SUDO cp "$NGINX_CONF" /etc/nginx/sites-available/portfolio
    $SUDO ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
    $SUDO rm -f /etc/nginx/sites-enabled/default

    if [ "$CLEAN" = true ]; then
        echo "  Limpiando cache de nginx..."
        $SUDO rm -rf /var/cache/nginx/*
        $SUDO rm -rf /var/lib/nginx/cache/*
        $SUDO nginx -T 2>/dev/null | grep -q proxy_cache_path && $SUDO rm -rf /var/cache/nginx/proxy/* 2>/dev/null || true
        $SUDO systemctl stop nginx 2>/dev/null || true
        $SUDO systemctl start nginx
        echo "  nginx cache limpiado y reiniciado"
    elif $SUDO nginx -t 2>&1; then
        $SUDO systemctl reload nginx
        echo "  nginx configurado y recargado"
    else
        echo "  Error en configuracion de nginx. Revisar: sudo nginx -t"
        exit 1
    fi
else
    echo "  Advertencia: $NGINX_CONF no encontrado, saltando"
fi

if [ "$ONLY_FRONTEND" = true ]; then
    echo ""
    echo "========================================="
    echo "  Frontend desplegado (--only-frontend)"
    echo "========================================="
    echo ""
    echo "  Frontend: http://$SERVER_IP/portfolio/"
    echo "  Domain:   http://alan-tek.com/portfolio/"
    echo ""
    echo "  IMPORTANTE: Haz Ctrl+Shift+R en el navegador para limpiar cache"
    echo ""
    exit 0
fi

# ── [6/8] Deploy backend Docker ──
echo ""
if [ "$SKIP_BACKEND" = true ]; then
    echo "[6/8] Saltando backend (--skip-backend)"
else
    echo "[6/8] Construyendo y levantando backend..."
    cd "$SCRIPT_DIR"
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true

    if [ "$CLEAN" = true ]; then
        echo "  Limpiando imagenes Docker viejas..."
        docker system prune -f 2>/dev/null || true
    fi

    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d
fi

# ── [7/8] Health check ──
echo ""
echo "[7/8] Esperando backend..."
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

# ── [8/8] Verificacion final ──
echo ""
echo "[8/8] Verificacion final..."

# Verificar frontend
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP/portfolio/")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  Frontend: OK (HTTP $HTTP_CODE)"
else
    echo "  Frontend: WARN (HTTP $HTTP_CODE)"
fi

# Verificar API
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/health")
if [ "$API_CODE" = "200" ]; then
    echo "  API:      OK (HTTP $API_CODE)"
else
    echo "  API:      WARN (HTTP $API_CODE)"
fi

# Verificar version del frontend desplegado
DEPLOYED_INDEX="$DEPLOY_DIR/index.html"
if [ -f "$DEPLOYED_INDEX" ]; then
    JS_COUNT=$(ls "$DEPLOY_DIR"/*.js 2>/dev/null | wc -l)
    echo "  Archivos JS desplegados: $JS_COUNT"
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
if [ "$CLEAN" = true ]; then
    echo "  *** IMPORTANTE: Haz Ctrl+Shift+R en el navegador ***"
    echo "  *** para forzar recarga sin cache              ***"
    echo ""
fi
echo "  Logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart:  docker compose -f docker-compose.prod.yml restart"
echo "  Stop:     docker compose -f docker-compose.prod.yml down"
echo ""
