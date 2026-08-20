#!/bin/bash
set -e

# ============================================
# Script de Deploy — ALANTEK
# Servidor: 192.168.1.43 / alan-tek.com
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/var/www/portfolio"
BACKEND_DIR="$SCRIPT_DIR/backend"
NGINX_CONF="$SCRIPT_DIR/nginx/portfolio.conf"
SERVER_IP="192.168.1.43"

# Detectar si se necesita sudo
if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

echo "========================================="
echo "  Deploy ALANTEK"
echo "========================================="

# 1. Verificar prerequisitos
if [ ! -f "$SCRIPT_DIR/docker-compose.prod.yml" ]; then
    echo "Error: docker-compose.prod.yml no encontrado."
    exit 1
fi

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

# 2. Verificar .env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Error: No existe .env en $SCRIPT_DIR"
    echo "Copiar desde .env.prod.example:  cp .env.prod.example .env && nano .env"
    exit 1
fi

# 3. Deploy frontend
echo ""
echo "[1/5] Copiando frontend a $DEPLOY_DIR ..."

FRONTEND_SRC="$SCRIPT_DIR/frontend-dist"
if [ ! -d "$FRONTEND_SRC" ]; then
    echo "Error: No se encontro frontend-dist en $SCRIPT_DIR"
    exit 1
fi

$SUDO mkdir -p "$DEPLOY_DIR"
$SUDO rm -rf "$DEPLOY_DIR"/*
$SUDO cp -r "$FRONTEND_SRC"/* "$DEPLOY_DIR"/
$SUDO chown -R www-data:www-data "$DEPLOY_DIR"
$SUDO chmod -R 755 "$DEPLOY_DIR"
echo "  Frontend desplegado en $DEPLOY_DIR"

# 4. Configurar nginx
echo ""
echo "[2/5] Configurando nginx..."

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
    echo "  Advertencia: $NGINX_CONF no encontrado, saltando configuracion nginx"
fi

# 5. Deploy backend Docker
echo ""
echo "[3/5] Deteniendo contenedor anterior..."
cd "$SCRIPT_DIR"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo ""
echo "[4/5] Construyendo y levantando backend..."
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# 6. Esperar health check
echo ""
echo "[5/5] Esperando backend..."
MAX_WAIT=45
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s "http://127.0.0.1:3000/api/health" 2>/dev/null | grep -q "ok"; then
        echo "  Backend OK!"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
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
