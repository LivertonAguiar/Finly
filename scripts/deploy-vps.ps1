# Finly VPS Automatic Deployment Script
# Target: Oracle Cloud VPS (Ubuntu 24.04 ARM64)

$ErrorActionPreference = "Stop"

$keyPath = "C:\Users\Suporte\Downloads\Oracle\ssh-key-2026-08-24.key"
$server = "ubuntu@147.15.74.236"
$remoteDir = "/opt/docker/finly"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "INICIANDO DEPLOY DO FINLY NA VPS ORACLE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Test-Path $keyPath)) {
    Write-Error "Chave SSH nao encontrada em: $keyPath"
    exit 1
}

Write-Host "Empacotando arquivos do projeto..." -ForegroundColor Yellow
tar.exe --exclude="node_modules" --exclude="android" --exclude=".git" --exclude="dist" --exclude=".agents" --exclude="scratch*" -czf finly-update.tar.gz .

Write-Host "Enviando pacote para a VPS ($server)..." -ForegroundColor Yellow
scp.exe -i $keyPath -o StrictHostKeyChecking=no finly-update.tar.gz "$($server):$($remoteDir)/"

if (Test-Path finly-update.tar.gz) {
    Remove-Item -Force finly-update.tar.gz
}

Write-Host "Reconstruindo container Docker no servidor..." -ForegroundColor Yellow
$cmd = 'cd /opt/docker/finly && tar -xzf finly-update.tar.gz && rm finly-update.tar.gz && docker compose up -d --build'
ssh.exe -i $keyPath -o StrictHostKeyChecking=no $server $cmd

Write-Host "==========================================" -ForegroundColor Green
Write-Host "DEPLOY CONCLUIDO COM SUCESSO NA VPS!" -ForegroundColor Green
Write-Host "Finly esta online e atualizado." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
