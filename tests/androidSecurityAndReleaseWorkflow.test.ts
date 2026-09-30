import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const gradle = read('android/app/build.gradle');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const filePaths = read('android/app/src/main/res/xml/file_paths.xml');
const workflow = read('.github/workflows/build-apk.yml');
const androidGitignore = read('android/.gitignore');
const signingGuidePath = 'android/RELEASE_SIGNING.md';

assert.doesNotMatch(
  gradle,
  /finly123456/u,
  'credenciais da assinatura Android nao podem permanecer no codigo-fonte',
);

for (const setting of [
  'FINLY_RELEASE_STORE_FILE',
  'FINLY_RELEASE_STORE_PASSWORD',
  'FINLY_RELEASE_KEY_ALIAS',
  'FINLY_RELEASE_KEY_PASSWORD',
]) {
  assert.match(gradle, new RegExp(setting, 'u'), `a assinatura release deve ler ${setting}`);
}

const debugBuild = gradle.match(/debug\s*\{(?<body>[^}]*)\}/u)?.groups?.body ?? '';
assert.doesNotMatch(
  debugBuild,
  /signingConfig\s+signingConfigs\.release/u,
  'o build debug nao pode usar a chave oficial de release',
);
assert.doesNotMatch(
  gradle,
  /releaseTaskRequested/u,
  'assembleRelease deve poder gerar APK sem assinatura para a etapa isolada de assinatura da CI',
);

assert.match(manifest, /android:allowBackup="false"/u);
assert.match(manifest, /android:usesCleartextTraffic="false"/u);
assert.match(manifest, /tools:replace="android:usesCleartextTraffic"/u);
assert.doesNotMatch(manifest, /android:largeHeap="true"/u);
assert.match(manifest, /android:dataExtractionRules="@xml\/data_extraction_rules"/u);

assert.doesNotMatch(
  filePaths,
  /<external-path/u,
  'o FileProvider nao pode compartilhar toda a memoria externa',
);
assert.match(filePaths, /<cache-path\s+name="shared_cache"\s+path="\."\s*\/>/u);
assert.match(filePaths, /<external-files-path\s+name="camera_images"\s+path="Pictures\/"\s*\/>/u);

assert.match(workflow, /permissions:\s*\n\s+contents: read/u);
assert.match(workflow, /concurrency:\s*\r?\n\s+group: finly-release-/u);
assert.match(workflow, /cancel-in-progress: true/u);
assert.match(workflow, /release-apk:\s*\r?\n\s+name:[^\r\n]*\r?\n\s+needs: quality/u);

const qualityStart = workflow.indexOf('  quality:');
const releaseStart = workflow.indexOf('  release-apk:');
assert.ok(qualityStart >= 0 && releaseStart > qualityStart, 'o job quality deve preceder release-apk');
const qualityJob = workflow.slice(qualityStart, releaseStart);
for (const requiredCheck of [
  'npm ci',
  'npm run check:version',
  'npx tsc --noEmit',
  'npm run test:transactions',
  'npm run test:security',
  'npm run build',
  'npm run test:build-budget',
  'npm run test:responsive',
  'testDebugUnitTest',
  'assembleDebug',
  'assembleRelease',
]) {
  assert.match(qualityJob, new RegExp(requiredCheck, 'u'), `quality deve executar: ${requiredCheck}`);
}
assert.doesNotMatch(qualityJob, /SKIP_RELEASE/u);

const releaseJob = workflow.slice(releaseStart);
for (const secret of [
  'FINLY_ANDROID_KEYSTORE_BASE64',
  'FINLY_ANDROID_KEYSTORE_PASSWORD',
  'FINLY_ANDROID_KEY_ALIAS',
  'FINLY_ANDROID_KEY_PASSWORD',
]) {
  assert.match(releaseJob, new RegExp(`secrets\\.${secret}`, 'u'), `release deve consumir ${secret}`);
}
assert.match(releaseJob, /APKSIGNER_PATH"?\s+sign/u);
assert.match(releaseJob, /EXPECTED_SIGNING_CERT_SHA256/u);
assert.match(releaseJob, /verify --print-certs[^\r\n]*2>&1/u);
assert.match(releaseJob, /certificate sha-256 digest/u);
assert.doesNotMatch(releaseJob, /outputs\/apk\/debug/u);
assert.match(androidGitignore, /^\*\.keystore\s*$/mu);
assert.match(androidGitignore, /^\*\.jks\s*$/mu);

assert.ok(existsSync(signingGuidePath), 'as credenciais exigidas pela release devem estar documentadas');
const signingGuide = read(signingGuidePath);
for (const secret of [
  'FINLY_ANDROID_KEYSTORE_BASE64',
  'FINLY_ANDROID_KEYSTORE_PASSWORD',
  'FINLY_ANDROID_KEY_ALIAS',
  'FINLY_ANDROID_KEY_PASSWORD',
]) {
  assert.match(signingGuide, new RegExp(secret, 'u'));
}
assert.match(signingGuide, /673AE78270CF5A92B9861D2759966EAB6F18D62FEB2DCE8F036D3683DEFFE471/u);
assert.match(signingGuide, /comprometid/iu);

console.log('OK: configuracao Android e workflow de release atendem aos contratos de seguranca.');
