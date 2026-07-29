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
sudo mkdir -p "$DEPLOY_DIR"
sudo rm -rf "$DEPLOY_DIR"/*
sudo cp -r "$FRONTEND_DIR"/dist/frontend/browser/* "$DEPLOY_DIR"/
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

echo ""
echo "[4/7] Configurando nginx..."
sudo cp "$NGINX_CONF" /etc/nginx/sites-available/portfolio
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo rm -f /etc/nginx/sites-enabled/default

# Probar configuracion de nginx
if sudo nginx -t 2>&1; then
    echo "Configuracion de nginx valida."
    sudo systemctl reload nginx
    echo "Nginx recargado."
else
    echo "Error en la configuracion de nginx. Revirtiendo..."
    sudo rm -f /etc/nginx/sites-enabled/portfolio
    sudo systemctl reload nginx
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
sleep 5

# Verificar que el backend esta corriendo
if docker compose -f docker-compose.prod.yml ps | grep -q "running"; then
    echo "Backend esta corriendo."
else
    echo "Error: El backend no pudo iniciarse. Revisar logs:"
    echo "  docker compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Verificar health check
echo "Verificando health check..."
if curl -s "http://$SERVER_IP/api/health" | grep -q "ok"; then
    echo "Health check: OK"
else
    echo "Warning: Health check fallo. El backend puede estar iniciando..."
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
