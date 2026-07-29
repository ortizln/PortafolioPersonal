#!/bin/bash
set -e

# ============================================
# Script de Deploy - Portafolio Personal
# Servidor: 192.168.1.71
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/var/www/portfolio"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
NGINX_CONF="$SCRIPT_DIR/nginx/portfolio.conf"
SERVER_IP="192.168.1.71"

# Detectar si se necesita sudo
if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

echo "========================================="
echo "  Deploy Portafolio Personal"
echo "========================================="

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "$SCRIPT_DIR/docker-compose.prod.yml" ]; then
    echo "Error: docker-compose.prod.yml no encontrado. Ejecuta desde la raiz del proyecto."
    exit 1
fi

# 2. Verificar que Docker esta instalado
if ! command -v docker &> /dev/null; then
    echo "Error: Docker no esta instalado."
    exit 1
fi

# 3. Verificar que Docker Compose esta instalado
if ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose no esta instalado."
    exit 1
fi

# 4. Verificar que nginx esta instalado
if ! command -v nginx &> /dev/null; then
    echo "Error: nginx no esta instalado. Instalar con: sudo apt install nginx"
    exit 1
fi

# 5. Verificar que Node.js esta instalado (para build del frontend)
if ! command -v node &> /dev/null; then
    echo "Error: Node.js no esta instalado."
    exit 1
fi

echo ""
echo "[1/7] Instalando dependencias del frontend..."
cd "$FRONTEND_DIR"
npm ci

echo ""
echo "[2/7] Build del frontend Angular..."
npm run build -- --configuration production

echo ""
echo "[3/7] Creando directorio de deploy y copiando archivos..."

# Encontrar donde Angular coloco los archivos build (varia segun version)
DIST_DIR="$FRONTEND_DIR/dist"
BUILD_OUTPUT=""

if [ -d "$DIST_DIR/frontend/browser" ]; then
    BUILD_OUTPUT="$DIST_DIR/frontend/browser"
elif [ -d "$DIST_DIR/browser" ]; then
    BUILD_OUTPUT="$DIST_DIR/browser"
elif [ -d "$DIST_DIR/portfolio-frontend/browser" ]; then
    BUILD_OUTPUT="$DIST_DIR/portfolio-frontend/browser"
elif [ -f "$DIST_DIR/index.html" ]; then
    BUILD_OUTPUT="$DIST_DIR"
else
    echo "Error: No se encontro el build de Angular en $DIST_DIR"
    exit 1
fi

echo "Build encontrado en: $BUILD_OUTPUT"

$SUDO mkdir -p "$DEPLOY_DIR"
$SUDO rm -rf "$DEPLOY_DIR"/*
$SUDO cp -r "$BUILD_OUTPUT"/* "$DEPLOY_DIR"/
$SUDO chown -R www-data:www-data "$DEPLOY_DIR"
$SUDO chmod -R 755 "$DEPLOY_DIR"

echo ""
echo "[4/7] Configurando nginx..."
$SUDO cp "$NGINX_CONF" /etc/nginx/sites-available/portfolio
$SUDO ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
$SUDO rm -f /etc/nginx/sites-enabled/default

# Probar configuracion de nginx
if $SUDO nginx -t 2>&1; then
    echo "Configuracion de nginx valida."
    $SUDO systemctl reload nginx
    echo "Nginx recargado."
else
    echo "Error en la configuracion de nginx. Revirtiendo..."
    $SUDO rm -f /etc/nginx/sites-enabled/portfolio
    $SUDO systemctl reload nginx
    exit 1
fi

echo ""
echo "[5/7] Deteniendo contenedor anterior (si existe)..."
cd "$SCRIPT_DIR"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo ""
echo "[6/7] Construyendo y levantando backend Docker..."
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "[7/7] Esperando a que el backend este listo..."

# Esperar hasta 30 segundos para que el health check responda
MAX_WAIT=30
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s "http://127.0.0.1:3000/api/health" 2>/dev/null | grep -q "ok"; then
        echo "Backend esta corriendo y respondiendo."
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo "  Esperando... ($WAITED/${MAX_WAIT}s)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "Error: Backend no respondio en ${MAX_WAIT}s. Revisar logs:"
    docker compose -f docker-compose.prod.yml logs --tail=20
    exit 1
fi

echo ""
echo "========================================="
echo "  Deploy completado!"
echo "========================================="
echo ""
echo "  Frontend: http://$SERVER_IP"
echo "  API:      http://$SERVER_IP/api"
echo "  API Docs: http://$SERVER_IP/api/api-docs"
echo ""
echo "  Logs backend:"
echo "    docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "  Reiniciar backend:"
echo "    docker compose -f docker-compose.prod.yml restart"
echo ""
echo "  Detener backend:"
echo "    docker compose -f docker-compose.prod.yml down"
echo ""
