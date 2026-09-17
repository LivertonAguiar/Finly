<#
.SYNOPSIS
    Deploy Unificado do Finly (All-in-One: Build, OTA, Git e VPS)
.DESCRIPTION
    Executa todo o pipeline de publicacao de uma vez so:
    1. Comita alteracoes pendentes de codigo (se houver)
    2. Compila o frontend React/Vite (npm run build)
    3. Empacota novo bundle OTA do Capacitor (scripts/package-web-bundle.mjs)
    4. Comita o manifesto atualizado (server/manifest.json)
    5. Sincroniza com GitHub (git push origin main)
    6. Realiza o deploy na VPS Oracle (completo ou modo rapido OTA)
.PARAMETER Message
    Mensagem opcional de commit para alteracoes pendentes de codigo.
.PARAMETER Notes
    Descricao das alteracoes para a versao OTA no manifesto.
.PARAMETER Fast
    Se ativado, envia o bundle OTA diretamente via SCP sem rebuild do Docker na VPS (~15 segundos).
.EXAMPLE
    npm run ship
    npm run ship -- -Message "Ajuste no bottom nav"
    npm run ship:fast
#>
param (
    [string]$Message = "",
    [string]$Notes = "",
    [switch]$Fast
)

$ErrorActionPreference = "Stop"

$startTime = Get-Date
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$keyPath = "C:\Users\Suporte\Downloads\Oracle\ssh-key-2026-08-24.key"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO PIPELINE UNIFICADO DO FINLY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 0. Verificacoes preliminares
if (-not (Test-Path $keyPath)) {
    throw "Chave SSH da VPS nao encontrada em: $keyPath"
}

$currentBranch = git -C $repoRoot rev-parse --abbrev-ref HEAD
if ($currentBranch -ne 'main') {
    throw "O deploy deve ser executado a partir da branch 'main'. Branch atual: $currentBranch"
}

# 1. Commit de alteracoes de codigo pendentes
$gitStatus = @(git -C $repoRoot status --porcelain)
if ($gitStatus.Count -gt 0) {
    Write-Host "`n📝 Alteracoes locais detectadas..." -ForegroundColor Yellow
    if (-not $Message) {
        $Message = "chore: atualizacoes e melhorias no aplicativo"
    }
    Write-Host "Comitando alteracoes: '$Message'..." -ForegroundColor Yellow
    git.exe -C $repoRoot add -A
    git.exe -C $repoRoot commit -m "$Message"
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao comitar alteracoes locais."
    }
} else {
    Write-Host "`n✔ Repositorio de codigo limpo." -ForegroundColor Green
}

# 2. Build de producao (tsc + vite)
Write-Host "`n🔨 Compilando frontend para producao (npm run build)..." -ForegroundColor Yellow
npm.cmd --prefix $repoRoot run build
if ($LASTEXITCODE -ne 0) {
    throw "Falha na compilacao de producao."
}
Write-Host "✔ Build de producao concluido com sucesso." -ForegroundColor Green

# 3. Empacotar bundle OTA (Capacitor Live Update)
Write-Host "`n📦 Empacotando novo bundle OTA para o aplicativo mobile..." -ForegroundColor Yellow
$bundleScript = Join-Path $repoRoot "scripts\package-web-bundle.mjs"
if ($Notes) {
    node.exe $bundleScript --notes "$Notes"
} else {
    node.exe $bundleScript
}
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao empacotar bundle OTA."
}

$manifestPath = Join-Path $repoRoot "server/manifest.json"
$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
$webVer = $manifest.web.version
Write-Host "✔ Bundle OTA v$webVer gerado com sucesso." -ForegroundColor Green

# 4. Commit do manifesto atualizado e Push para GitHub
Write-Host "`n📤 Comitando manifesto OTA e enviando para GitHub..." -ForegroundColor Yellow
git -C $repoRoot add server/manifest.json
$manifestStatus = @(git -C $repoRoot status --porcelain server/manifest.json)
if ($manifestStatus.Count -gt 0) {
    $otaMsg = 'chore(ota): publicar bundle web v' + $webVer
    git -C $repoRoot commit -m $otaMsg
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao comitar manifesto OTA."
    }
}

git.exe -C $repoRoot push origin main
if ($LASTEXITCODE -ne 0) {
    throw "Falha no git push origin main."
}
Write-Host "✔ Codigo e manifesto sincronizados com o GitHub." -ForegroundColor Green

# 5. Deploy na VPS
if ($Fast) {
    Write-Host "`n⚡ Executando deploy rapido de bundle OTA na VPS (~15s)..." -ForegroundColor Cyan
    powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "deploy-web-ota.ps1") -Notes "$Notes"
    if ($LASTEXITCODE -ne 0) {
        throw "Falha no deploy rapido OTA."
    }
} else {
    Write-Host "`n🌐 Executando deploy completo na VPS Oracle (Docker + API + OTA)..." -ForegroundColor Cyan
    powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "deploy-vps.ps1")
    if ($LASTEXITCODE -ne 0) {
        throw "Falha no deploy completo da VPS."
    }
}

$elapsed = (Get-Date) - $startTime
$elapsedFormatted = "{0:mm}m {0:ss}s" -f $elapsed

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "🎉 PIPELINE UNIFICADO CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "⏱ Tempo total: $elapsedFormatted" -ForegroundColor White
Write-Host "📦 Versao OTA ativa: v$webVer" -ForegroundColor White
Write-Host "📱 App mobile e versao Web estao 100% atualizados!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
