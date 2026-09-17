# Finly Web Bundle OTA Deployment Script
# Target: Oracle Cloud VPS (Ubuntu 24.04 ARM64)
# Rapid deployment of React/Vite bundles without rebuilding Docker containers

param (
    [string]$WebVersion = "",
    [switch]$Mandatory = $true,
    [string]$MinNative = "1.1.0",
    [string]$Notes = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$keyPath = "C:\Users\Suporte\Downloads\Oracle\ssh-key-2026-08-24.key"
$server = "ubuntu@147.15.74.236"
$remoteDir = "/opt/docker/finly"
$remoteBundlesDir = "$remoteDir/server/public/bundles"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "INICIANDO DEPLOY WEB OTA DO FINLY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Test-Path $keyPath)) {
    Write-Error "Chave SSH nao encontrada em: $keyPath"
    exit 1
}

# 1. Build Frontend
Write-Host "Compilando frontend React/Vite..." -ForegroundColor Yellow
npm.cmd --prefix $repoRoot run build
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao compilar frontend (npm run build)."
}

# 2. Package Web Bundle
Write-Host "Empacotando bundle web e gerando SHA-256..." -ForegroundColor Yellow
$pkgArgs = @("scripts/package-web-bundle.mjs")
if ($WebVersion) {
    $pkgArgs += @("--version", $WebVersion)
}
if ($MinNative) {
    $pkgArgs += @("--min-native", $MinNative)
}
if ($Mandatory) {
    $pkgArgs += @("--mandatory")
}
if ($Notes) {
    $pkgArgs += @("--notes", $Notes)
}

node.exe @pkgArgs
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao empacotar bundle web."
}

# 3. Read generated manifest
$manifestPath = Join-Path $repoRoot "server/manifest.json"
if (-not (Test-Path $manifestPath)) {
    throw "Manifesto server/manifest.json nao encontrado."
}
$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
$generatedWebVer = $manifest.web.version
$bundleFileName = "finly-bundle-v$generatedWebVer.zip"
$bundleLocalPath = Join-Path $repoRoot "server/public/bundles/$bundleFileName"

if (-not (Test-Path $bundleLocalPath)) {
    throw "Arquivo de bundle nao encontrado em: $bundleLocalPath"
}

Write-Host "Bundle gerado com sucesso:" -ForegroundColor Green
Write-Host "  - Versao Web: v$generatedWebVer" -ForegroundColor White
Write-Host "  - SHA-256: $($manifest.web.sha256)" -ForegroundColor White
Write-Host "  - Arquivo: $bundleFileName" -ForegroundColor White

# 4. Ensure remote directories exist on VPS
Write-Host "Criando diretorios remotos na VPS..." -ForegroundColor Yellow
ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server "mkdir -p $remoteBundlesDir"
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao criar diretorio remoto de bundles na VPS."
}

# 5. Upload ZIP bundle to VPS
Write-Host "Enviando arquivo de bundle para a VPS..." -ForegroundColor Yellow
scp.exe -i $keyPath -o StrictHostKeyChecking=accept-new $bundleLocalPath "$($server):$remoteBundlesDir/$bundleFileName"
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao enviar arquivo de bundle para a VPS."
}

# 6. Upload updated manifest.json to VPS
Write-Host "Atualizando manifesto na VPS..." -ForegroundColor Yellow
scp.exe -i $keyPath -o StrictHostKeyChecking=accept-new $manifestPath "$($server):$remoteDir/server/manifest.json"
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao enviar manifesto para a VPS."
}

# 6.1 Update dist inside running container for instant Web browser update
Write-Host "Atualizando frontend web dentro do container..." -ForegroundColor Yellow
$distTar = Join-Path ([IO.Path]::GetTempPath()) ("dist-{0}.tar.gz" -f [guid]::NewGuid().ToString('N'))
tar.exe -czf $distTar -C "$repoRoot/dist" .
scp.exe -i $keyPath -o StrictHostKeyChecking=accept-new $distTar "$($server):$remoteDir/dist-update.tar.gz"
ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server "mkdir -p $remoteDir/dist_tmp && tar -xzf $remoteDir/dist-update.tar.gz -C $remoteDir/dist_tmp && docker cp $remoteDir/dist_tmp/. finly-app:/app/dist/ && rm -rf $remoteDir/dist_tmp $remoteDir/dist-update.tar.gz"
Remove-Item -LiteralPath $distTar -Force -ErrorAction SilentlyContinue

# 7. Validate endpoints on VPS
Write-Host "Validando manifesto e download do bundle na VPS..." -ForegroundColor Yellow
$manifestCheck = ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server "curl -fsS http://127.0.0.1:3000/api/app/manifest"
if ($LASTEXITCODE -ne 0 -or -not $manifestCheck) {
    throw "Falha ao validar endpoint /api/app/manifest na VPS."
}

$remoteManifest = $manifestCheck | ConvertFrom-Json
if ($remoteManifest.web.version -ne $generatedWebVer) {
    throw "Versao divergente no manifesto remoto: esperado=$generatedWebVer; obtido=$($remoteManifest.web.version)"
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "DEPLOY OTA CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "Bundle v$generatedWebVer ativo e disponivel para os usuarios." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
