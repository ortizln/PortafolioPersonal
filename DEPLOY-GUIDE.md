# ALANTEK — Deploy Guide

## Prerrequisitos en el servidor (192.168.1.43)

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx postgresql-client
sudo systemctl enable docker nginx

# PostgreSQL (ya instalado)
# Verificar: psql --version
```

## Deploy paso a paso

### Opción A: Automática (desde Windows)

```powershell
# Build + paquete + subir + deploy remoto
.\deploy-prepare.ps1 -AutoUpload -ServerUser root

# Solo preparar paquete (sin subir)
.\deploy-prepare.ps1
```

### Opción B: Manual

#### 1. Preparar paquete (Windows)
```powershell
.\deploy-prepare.ps1 -SkipBuild  # o sin -SkipBuild para rebuild
```

#### 2. Subir al servidor
```bash
scp deploy-alantek-*.tar.gz root@192.168.1.43:/tmp/
```

#### 3. En el servidor
```bash
# Extraer
cd /tmp
tar -xzf deploy-alantek-*.tar.gz
mkdir -p /tmp/alantek-deploy
mv /tmp/backend /tmp/frontend-dist /tmp/*.sh /tmp/*.yml /tmp/.env.prod.example /tmp/nginx /tmp/alantek-deploy/

# Configurar .env de producción
cd /tmp/alantek-deploy
cp .env.prod.example .env
nano .env  # ← Completar valores reales
```

#### 4. Ejecutar migraciones + seed
```bash
cd /tmp/alantek-deploy
bash migrate-complete.sh --env=production
```

#### 5. Deploy con Docker
```bash
cd /tmp/alantek-deploy
bash deploy.sh
```

#### 6. Configurar nginx
```bash
sudo cp nginx/portfolio.conf /etc/nginx/sites-available/portfolio
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## Variables de producción (.env)

| Variable | Ejemplo |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@localhost:5432/portfolio_db?schema=public` |
| `JWT_SECRET` | Clave aleatoria de 64+ caracteres |
| `JWT_REFRESH_SECRET` | Otra clave aleatoria de 64+ caracteres |
| `CORS_ORIGIN` | `http://192.168.1.43` |

## Verificar deploy

```bash
# Health check
curl http://localhost:3000/api/health

# API pública
curl http://localhost:3000/api/public/company

# Frontend (vía nginx)
curl -I http://192.168.1.43/

# Ver logs
docker logs portfolio-api --tail=50
```

## Troubleshooting

```bash
# Reiniciar backend
docker restart portfolio-api

# Ver logs en tiempo real
docker logs -f portfolio-api

# Reiniciar nginx
sudo systemctl restart nginx

# Verificar puertos
ss -tlnp | grep -E '80|3000'
```
