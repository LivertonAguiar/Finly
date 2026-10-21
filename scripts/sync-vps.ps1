<#
.SYNOPSIS
    Sincroniza projetos locais do Windows para a VPS Oracle (/opt/docker/)
.DESCRIPTION
    Permite enviar de forma rápida e segura os arquivos de Finly, L&M Papelaria ou Rotas
    para seus respectivos workspaces isolados na VPS, ignorando node_modules, .git e builds.
.EXAMPLE
    .\sync-vps.ps1 -Project finly
    .\sync-vps.ps1 -Project lm
    .\sync-vps.ps1 -Project rotas
    .\sync-vps.ps1 -Project all
#>
[CmdletBinding()]
param(
    [ValidateSet("finly", "lm", "rotas", "all")]
    [string]$Project = "all"
)

$ErrorActionPreference = "Stop"

$key = "C:\Users\Suporte\Downloads\Oracle\ssh-key-2026-08-24.key"
$server = "ubuntu@147.15.74.236"

if (-not (Test-Path $key)) {
    Write-Error "Chave SSH não encontrada em: $key"
    exit 1
}

function Sync-Folder {
    param(
        [string]$Name,
        [string]$LocalPath,
        [string]$RemoteDir,
        [string[]]$ExtraExcludes = @()
    )

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Sincronizando: $Name" -ForegroundColor Cyan
    Write-Host "Origem:  $LocalPath" -ForegroundColor Gray
    Write-Host "Destino: $RemoteDir" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Cyan

    if (-not (Test-Path $LocalPath)) {
        Write-Warning "Diretório local $LocalPath não encontrado. Ignorando."
        return
    }

    $tempTar = Join-Path $env:TEMP ("sync-$Name-" + [guid]::NewGuid().ToString("N") + ".tar.gz")

    $defaultExcludes = @(
        '--exclude="node_modules"',
        '--exclude=".git"',
        '--exclude=".data"',
        '--exclude=".env"',
        '--exclude="dist"',
        '--exclude=".expo"',
        '--exclude="android"',
        '--exclude="*.apk"',
        '--exclude="*.tar.gz"',
        '--exclude="*.log"',
        '--exclude="*.tmp"',
        '--exclude="server/data/stores"',
        '--exclude="server/data/stores/*"',
        '--exclude="server/data/ollama"',
        '--exclude="server/data/ollama/*"',
        '--exclude="server/data/*.json"',
        '--exclude="server/public/bundles/*"'
    )

    $excludes = $defaultExcludes + $ExtraExcludes

    Write-Host "-> Compactando arquivos locais..." -ForegroundColor Yellow
    Push-Location $LocalPath
    try {
        $tarCmd = "tar.exe -czf `"$tempTar`" $($excludes -join ' ') ."
        Invoke-Expression $tarCmd
    } finally {
        Pop-Location
    }

    $sizeMb = [Math]::Round(((Get-Item $tempTar).Length / 1MB), 2)
    Write-Host "-> Pacote gerado: $sizeMb MB. Enviando para a VPS..." -ForegroundColor Yellow

    scp.exe -o BatchMode=yes -i $key $tempTar "${server}:/tmp/sync-$Name.tar.gz"
    if ($LASTEXITCODE -ne 0) { throw "Falha no envio via SCP." }

    Write-Host "-> Extraindo em $RemoteDir..." -ForegroundColor Yellow
    ssh.exe -o BatchMode=yes -i $key $server "tar --no-same-owner --warning=no-timestamp -xzf /tmp/sync-$Name.tar.gz -C $RemoteDir 2>/dev/null || tar --no-same-owner -xzf /tmp/sync-$Name.tar.gz -C $RemoteDir || true; rm -f /tmp/sync-$Name.tar.gz"

    if (Test-Path $tempTar) {
        Remove-Item -Force $tempTar
    }

    Write-Host "OK: $Name sincronizado com sucesso!" -ForegroundColor Green
}

switch ($Project) {
    "finly" {
        Sync-Folder -Name "finly" -LocalPath "C:\Users\Suporte\Documents\Finly\planner-financeiro" -RemoteDir "/opt/docker/finly"
    }
    "lm" {
        Sync-Folder -Name "lm-papelaria" -LocalPath "C:\Users\Suporte\Documents\L&M Papelaria" -RemoteDir "/opt/docker/lm-papelaria"
    }
    "rotas" {
        Sync-Folder -Name "rotas" -LocalPath "C:\Users\Suporte\Documents\Rotas" -RemoteDir "/opt/docker/rotas"
    }
    "all" {
        Sync-Folder -Name "finly" -LocalPath "C:\Users\Suporte\Documents\Finly\planner-financeiro" -RemoteDir "/opt/docker/finly"
        Sync-Folder -Name "lm-papelaria" -LocalPath "C:\Users\Suporte\Documents\L&M Papelaria" -RemoteDir "/opt/docker/lm-papelaria"
        Sync-Folder -Name "rotas" -LocalPath "C:\Users\Suporte\Documents\Rotas" -RemoteDir "/opt/docker/rotas"
    }
}

Write-Host "`nSincronização concluída com sucesso!" -ForegroundColor Green
