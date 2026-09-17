# Finly VPS Automatic Deployment Script
# Target: Oracle Cloud VPS (Ubuntu 24.04 ARM64)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$keyPath = "C:\Users\Suporte\Downloads\Oracle\ssh-key-2026-08-24.key"
$server = "ubuntu@147.15.74.236"
$remoteDir = "/opt/docker/finly"
$archiveName = 'finly-update.tar.gz'
$archivePath = Join-Path ([IO.Path]::GetTempPath()) ("finly-update-{0}.tar.gz" -f [guid]::NewGuid().ToString('N'))

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "INICIANDO DEPLOY DO FINLY NA VPS ORACLE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Test-Path $keyPath)) {
    Write-Error "Chave SSH nao encontrada em: $keyPath"
    exit 1
}

$expectedVersion = (Get-Content -Raw (Join-Path $repoRoot 'package.json') | ConvertFrom-Json).version
$apkUrl = "https://github.com/LivertonAguiar/Finly/releases/download/v$expectedVersion/finly-v$expectedVersion.apk"
$manifestPath = Join-Path $repoRoot 'server\manifest.json'
$manifestInfo = Get-Content -Raw $manifestPath | ConvertFrom-Json

if ($manifestInfo.native.version -ne $expectedVersion) {
    throw "Deploy bloqueado: o manifesto OTA ainda aponta para a versao nativa $($manifestInfo.native.version), esperada $expectedVersion."
}

$bundleUri = [Uri]$manifestInfo.web.bundleUrl
if ($bundleUri.Scheme -ne 'https' -or $bundleUri.Host -ne 'finly.lpaguiar.com.br') {
    throw "Deploy bloqueado: a URL do bundle OTA nao pertence ao dominio oficial."
}

$bundleFileName = [IO.Path]::GetFileName($bundleUri.AbsolutePath)
$bundlePath = Join-Path $repoRoot "server\public\bundles\$bundleFileName"
if (-not (Test-Path -LiteralPath $bundlePath -PathType Leaf)) {
    throw "Deploy bloqueado: bundle OTA ausente em $bundlePath."
}

$bundleHash = (Get-FileHash -LiteralPath $bundlePath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($bundleHash -ne $manifestInfo.web.sha256.ToLowerInvariant()) {
    throw "Deploy bloqueado: o hash local do bundle OTA difere do manifesto."
}

Write-Host "Validando Git, versao e APK oficial v$expectedVersion..." -ForegroundColor Yellow

$gitStatus = @(git -C $repoRoot status --porcelain)
if ($LASTEXITCODE -ne 0 -or $gitStatus.Count -gt 0) {
    throw "Deploy bloqueado: o repositorio precisa estar limpo e com todas as alteracoes commitadas."
}

$currentBranch = git -C $repoRoot rev-parse --abbrev-ref HEAD
if ($LASTEXITCODE -ne 0 -or $currentBranch -ne 'main') {
    throw "Deploy bloqueado: a branch ativa precisa ser main."
}

git -C $repoRoot fetch origin main --quiet
if ($LASTEXITCODE -ne 0) { throw "Deploy bloqueado: nao foi possivel atualizar origin/main." }

$versionTag = "v$expectedVersion"
git -C $repoRoot fetch origin "refs/tags/$versionTag`:refs/tags/$versionTag" --quiet
if ($LASTEXITCODE -ne 0) { throw "Deploy bloqueado: nao foi possivel obter a tag $versionTag." }

$localCommit = git -C $repoRoot rev-parse HEAD
$remoteCommit = git -C $repoRoot rev-parse origin/main
if ($localCommit -ne $remoteCommit) {
    throw "Deploy bloqueado: o commit local ainda nao esta sincronizado com origin/main."
}

$tagCommit = git -C $repoRoot rev-list -n 1 $versionTag 2>$null
if (-not $tagCommit) {
    throw "Deploy bloqueado: a tag $versionTag nao foi encontrada no repositorio."
}

git -C $repoRoot merge-base --is-ancestor $tagCommit $localCommit
if ($LASTEXITCODE -ne 0) {
    throw "Deploy bloqueado: o commit local nao descende da tag de release $versionTag."
}

npm.cmd --prefix $repoRoot run check:version
if ($LASTEXITCODE -ne 0) { throw "Deploy bloqueado: as fontes de versao estao dessincronizadas." }

curl.exe -L --fail --silent --head --max-time 30 --output NUL $apkUrl
if ($LASTEXITCODE -ne 0) {
    throw "Deploy bloqueado: o APK v$expectedVersion ainda nao foi publicado no GitHub."
}

try {
Write-Host "Empacotando arquivos do projeto..." -ForegroundColor Yellow
tar.exe --exclude="node_modules" --exclude="android" --exclude=".git" --exclude="dist" --exclude=".agents" --exclude="*oracleJdk*" --exclude="scratch*" --exclude="server/data/stores" --exclude="server/data/stores/*" --exclude="server/data/*.json" --exclude="server/public/bundles/*" -czf $archivePath -C $repoRoot .
if ($LASTEXITCODE -ne 0) { throw "Deploy falhou ao criar o pacote de atualizacao." }
if (-not (Test-Path -LiteralPath $archivePath -PathType Leaf) -or (Get-Item -LiteralPath $archivePath).Length -le 0) {
    throw "Deploy falhou: o pacote de atualizacao esta ausente ou vazio."
}

Write-Host "Enviando pacote para a VPS ($server)..." -ForegroundColor Yellow
scp.exe -i $keyPath -o StrictHostKeyChecking=accept-new $archivePath "$($server):$remoteDir/$archiveName"
if ($LASTEXITCODE -ne 0) { throw "Deploy falhou ao enviar o pacote para a VPS." }

Write-Host "Enviando bundle OTA validado ($bundleFileName)..." -ForegroundColor Yellow
ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server "mkdir -p '$remoteDir/server/public/bundles'"
if ($LASTEXITCODE -ne 0) { throw "Deploy falhou ao preparar o diretorio remoto de bundles." }
scp.exe -i $keyPath -o StrictHostKeyChecking=accept-new $bundlePath "$($server):$remoteDir/server/public/bundles/$bundleFileName"
if ($LASTEXITCODE -ne 0) { throw "Deploy falhou ao enviar o bundle OTA." }

Write-Host "Reconstruindo container Docker no servidor..." -ForegroundColor Yellow
$cmd = 'cd /opt/docker/finly && tar -xzf finly-update.tar.gz --exclude="server/data/stores/*" --exclude="server/data/*.json" --exclude="server/public/bundles/*" && rm -f finly-update.tar.gz && docker compose up -d --build --remove-orphans'
ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server $cmd
if ($LASTEXITCODE -ne 0) { throw "Deploy falhou durante a reconstrucao do container." }

Write-Host "Aplicando migrações SQL no banco de dados Supabase..." -ForegroundColor Yellow
$migrationCmd = 'for f in /opt/docker/finly/supabase/migrations/*.sql; do if [ -f "$f" ]; then cat "$f" | sudo docker exec -i supabase-db psql -U postgres -d postgres >/dev/null 2>&1 || true; fi; done'
ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server $migrationCmd

Write-Host "Validando API e bundle implantados..." -ForegroundColor Yellow
$apiRaw = $null
for ($attempt = 1; $attempt -le 5; $attempt++) {
    $apiRaw = ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server 'curl -fsS http://127.0.0.1:3000/api/app/version' 2>$null
    if ($LASTEXITCODE -eq 0 -and $apiRaw) { break }
    Start-Sleep -Seconds 2
}

if (-not $apiRaw) { throw "Deploy concluido, mas a API nao respondeu ao health check." }

$manifestRaw = $null
for ($attempt = 1; $attempt -le 5; $attempt++) {
    $manifestRaw = ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server 'curl -fsS http://127.0.0.1:3000/api/app/manifest' 2>$null
    if ($LASTEXITCODE -eq 0 -and $manifestRaw) { break }
    Start-Sleep -Seconds 2
}
if (-not $manifestRaw) { throw "Deploy concluido, mas o manifesto OTA nao respondeu ao health check." }

$bundleRaw = ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server 'curl -fsS http://127.0.0.1:3000/app-version.json'
if ($LASTEXITCODE -ne 0 -or -not $bundleRaw) {
    throw "Deploy concluido, mas o manifesto de versao do bundle nao respondeu."
}

$apiInfo = $apiRaw | ConvertFrom-Json
$deployedManifest = $manifestRaw | ConvertFrom-Json
$apiVersion = $apiInfo.version
$apiLatestVersion = $apiInfo.latestVersion
$bundleVersion = ($bundleRaw | ConvertFrom-Json).version
if ($apiVersion -ne $expectedVersion -or $apiLatestVersion -ne $expectedVersion -or $bundleVersion -ne $expectedVersion -or $deployedManifest.native.version -ne $expectedVersion -or $deployedManifest.web.version -ne $manifestInfo.web.version -or $deployedManifest.web.sha256 -ne $bundleHash) {
    throw "Deploy inconsistente: esperado=$expectedVersion; api=$apiVersion; latest=$apiLatestVersion; bundle=$bundleVersion; ota=$($deployedManifest.web.version)."
}

curl.exe -fsSI --max-time 30 "$($manifestInfo.web.bundleUrl)" >$null
if ($LASTEXITCODE -ne 0) {
    ssh.exe -n -i $keyPath -o StrictHostKeyChecking=accept-new $server "curl -fsSI --max-time 15 'http://127.0.0.1:3000/bundles/finly-bundle-v$($manifestInfo.web.version).zip' >/dev/null"
    if ($LASTEXITCODE -ne 0) { throw "Deploy concluido, mas o bundle OTA nao esta acessivel." }
}

} finally {
    if (Test-Path -LiteralPath $archivePath) {
        Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "DEPLOY CONCLUIDO COM SUCESSO NA VPS!" -ForegroundColor Green
Write-Host "Finly esta online e atualizado." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
