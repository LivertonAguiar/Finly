# Assinatura do APK Android

O workflow `.github/workflows/build-apk.yml` separa validacao, compilacao e publicacao:

1. O job `quality` roda testes e gera um APK `release` sem assinatura. Ele nao recebe secrets.
2. O job `release-apk` e o unico com permissao de escrita. Quando ainda nao existe um APK oficial para a versao, ele alinha, assina e valida o artefato antes da publicacao.
3. Pull requests e validacoes de uma versao ja publicada continuam funcionando sem secrets de assinatura.

## Secrets obrigatorios no GitHub

Cadastre estes quatro Actions secrets em **Settings > Secrets and variables > Actions**:

- `FINLY_ANDROID_KEYSTORE_BASE64`: conteudo integral do keystore convertido para Base64 em uma unica linha.
- `FINLY_ANDROID_KEYSTORE_PASSWORD`: senha do keystore.
- `FINLY_ANDROID_KEY_ALIAS`: alias da chave usada para assinar o aplicativo.
- `FINLY_ANDROID_KEY_PASSWORD`: senha da chave identificada pelo alias.

No PowerShell, copie o Base64 diretamente para a area de transferencia, sem grava-lo em arquivo ou no historico do terminal:

```powershell
$keystorePath = (Resolve-Path .\android\app\finly-release.keystore).Path
[Convert]::ToBase64String([IO.File]::ReadAllBytes($keystorePath)) | Set-Clipboard
```

Nao registre os valores dos secrets em documentacao, logs, issues ou commits.

## Identidade esperada

Para impedir a publicacao com uma chave diferente e quebrar atualizacoes instaladas, a CI exige este SHA-256 do certificado atual:

```text
673AE78270CF5A92B9861D2759966EAB6F18D62FEB2DCE8F036D3683DEFFE471
```

Qualquer troca desse valor exige um plano explicito de migracao da assinatura Android e teste de atualizacao sobre uma instalacao real da versao anterior.

## Contencao e rotacao

A chave e suas credenciais ja estiveram versionadas; portanto, devem ser tratadas como comprometidas. Mover as credenciais ativas para GitHub Secrets evita nova exposicao no codigo, mas nao desfaz o historico existente nem rotaciona a identidade do aplicativo.

Esta alteracao preserva deliberadamente a chave atual para manter compatibilidade com instalacoes existentes. A rotacao deve ser feita em uma etapa separada, com backup offline, estrategia de linhagem/compatibilidade por versao do Android e validacao de atualizacao antes de remover a chave anterior.

## Uso local do Gradle

O `android/app/build.gradle` aceita, opcionalmente, `FINLY_RELEASE_STORE_FILE`, `FINLY_RELEASE_STORE_PASSWORD`, `FINLY_RELEASE_KEY_ALIAS` e `FINLY_RELEASE_KEY_PASSWORD`. Sem esses quatro valores, `assembleRelease` gera somente o APK sem assinatura esperado pela CI. O APK oficial continua sendo assinado e publicado exclusivamente pelo GitHub Actions.
