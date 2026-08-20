# ============================================
# deploy-prepare.ps1 — Prepara paquete de deploy
#
# Ejecutar desde la raiz del proyecto en Windows.
# Genera un tar.gz listo para subir al servidor.
# ============================================
param(
    [string]$ServerIP = "192.168.1.43",
    [string]$ServerUser = "root",
    [switch]$SkipBuild,
    [switch]$AutoUpload
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = "$RootDir\backend"
$FrontendDir = "$RootDir\frontend"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$PackageFile = "$RootDir\deploy-alantek-$Timestamp.tar.gz"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ALANTEK — Preparar Deploy" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Servidor: ${ServerUser}@${ServerIP}"
Write-Host "  Paquete:  $PackageFile"
Write-Host ""

# 1. Build frontend
if (-not $SkipBuild) {
    Write-Host "[1/5] Build del frontend Angular..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    npx ng build --configuration production
    if ($LASTEXITCODE -ne 0) { throw "Build del frontend fallo" }
    Pop-Location
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "[1/5] Build omitido (SkipBuild)" -ForegroundColor DarkGray
}

# 2. Verificar build output
Write-Host ""
Write-Host "[2/5] Verificando build output..." -ForegroundColor Yellow
$DistDir = "$FrontendDir\dist\portfolio\browser"
if (-not (Test-Path $DistDir)) {
    $DistDir = "$FrontendDir\dist\frontend\browser"
}
if (-not (Test-Path $DistDir)) {
    $DistDir = "$FrontendDir\dist\browser"
}
if (-not (Test-Path $DistDir)) {
    throw "No se encontro el build en $FrontendDir\dist"
}

$indexFile = Join-Path $DistDir "index.html"
if (-not (Test-Path $indexFile)) {
    throw "No se encontro index.html en $DistDir"
}

Write-Host "  Build: $DistDir" -ForegroundColor Green
$distFiles = (Get-ChildItem -Path $DistDir -Recurse -File).Count
Write-Host "  Archivos: $distFiles" -ForegroundColor Green

# 3. Crear paquete
Write-Host ""
Write-Host "[3/5] Creando paquete de deploy..." -ForegroundColor Yellow
$TempDir = "$env:TEMP\alantek-deploy"
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copiar archivos necesarios
Copy-Item -Recurse "$BackendDir" "$TempDir\backend" -Exclude "node_modules",".env"
Copy-Item -Recurse "$DistDir" "$TempDir\frontend-dist"
Copy-Item "$RootDir\migrate-complete.sh" "$TempDir\" -ErrorAction SilentlyContinue
Copy-Item "$RootDir\deploy.sh" "$TempDir\"
Copy-Item "$RootDir\.env.prod.example" "$TempDir\"
Copy-Item -Recurse "$RootDir\nginx" "$TempDir\"
Copy-Item "$RootDir\docker-compose.prod.yml" "$TempDir\"

# Crear tar.gz
tar -czf $PackageFile -C $TempDir .
$sizeMB = [math]::Round((Get-Item $PackageFile).Length / 1MB, 1)
Write-Host "  Paquete: $PackageFile ($sizeMB MB)" -ForegroundColor Green

# 4. Subir al servidor
if ($AutoUpload) {
    Write-Host ""
    Write-Host "[4/5] Subiendo al servidor..." -ForegroundColor Yellow
    scp $PackageFile "${ServerUser}@${ServerIP}:/tmp/"
    if ($LASTEXITCODE -ne 0) { throw "SCP fallo" }
    Write-Host "  Subido a ${ServerIP}:/tmp/" -ForegroundColor Green

    # 5. Ejecutar deploy remoto
    Write-Host ""
    Write-Host "[5/5] Ejecutando deploy remoto..." -ForegroundColor Yellow
    $DeployCmd = @"
cd /tmp && \
rm -rf alantek-deploy && mkdir -p alantek-deploy && \
tar -xzf deploy-alantek-*.tar.gz -C alantek-deploy && \
cd alantek-deploy && \
chmod +x deploy.sh 2>/dev/null; \
bash deploy.sh
"@
    ssh "${ServerUser}@${ServerIP}" $DeployCmd
    Write-Host "  Deploy remoto completado" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[4/5] Paquete listo. Subir manualmente:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  scp $PackageFile ${ServerUser}@${ServerIP}:/tmp/" -ForegroundColor White
    Write-Host ""
    Write-Host "[5/5] En el servidor, ejecutar:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  cd /tmp && rm -rf alantek-deploy && mkdir -p alantek-deploy" -ForegroundColor White
    Write-Host "  tar -xzf deploy-alantek-*.tar.gz -C alantek-deploy" -ForegroundColor White
    Write-Host "  cd alantek-deploy && bash deploy.sh" -ForegroundColor White
}

# Cleanup
Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Listo!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
