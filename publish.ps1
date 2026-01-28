$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando proceso de publicación segura..." -ForegroundColor Green

# 0. Asegurar Entry Point (index.html de desarrollo)
if (Test-Path "index.dev.html") {
    Write-Host "🛠️ Restaurando index.html de desarrollo..." -ForegroundColor Cyan
    Copy-Item "index.dev.html" "index.html" -Force
}

# 1. Construir el proyecto (Genera carpeta dist)
Write-Host "📦 Compilando proyecto..." -ForegroundColor Cyan
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
npm run build
if ($LASTEXITCODE -ne 0) { throw "Error en la compilación" }

# 2. Limpieza de raíz (Assets viejos)
Write-Host "🧹 Limpiando versión anterior..." -ForegroundColor Yellow
Remove-Item -Path "assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "index.html" -Force -ErrorAction SilentlyContinue

# 3. Trasplante (Dist -> Raíz)
Write-Host "🌱 Trasplantando archivos a producción..." -ForegroundColor Cyan
Copy-Item -Path "dist/index.html" -Destination "index.html" -Force
Copy-Item -Path "dist/assets" -Destination "assets" -Recurse -Force
# Asegurar que los assets estáticos críticos también se copien
if (Test-Path "dist/logo.png") { Copy-Item "dist/logo.png" "logo.png" -Force }
if (Test-Path "dist/favicon.ico") { Copy-Item "dist/favicon.ico" "favicon.ico" -Force }
if (Test-Path "dist/CNAME") { Copy-Item "dist/CNAME" "CNAME" -Force }

# 4. Git Push
Write-Host "⬆️ Subiendo cambios a GitHub..." -ForegroundColor Cyan
git add .
$msg = Read-Host "📝 Describe tu cambio (Enter para default 'update content')"
if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "chore: update content and rebuild assets" }
git commit -m "$msg"
git push origin main

Write-Host "✅ ¡LISTO! Todo actualizado. Espera 2 min y limpia caché." -ForegroundColor Green
