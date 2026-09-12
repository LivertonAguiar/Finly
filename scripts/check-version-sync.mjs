import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readText = relativePath => readFile(path.join(rootDir, relativePath), 'utf8');
const readJson = async relativePath => JSON.parse(await readText(relativePath));

const packageJson = await readJson('package.json');
const packageLock = await readJson('package-lock.json');
const releaseSource = await readText('src/data/releases.ts');
const gradleSource = await readText('android/app/build.gradle');
const workflowSource = await readText('.github/workflows/build-apk.yml');
const viteSource = await readText('vite.config.ts');
const deploySource = await readText('scripts/deploy-vps.ps1');
const readmeSource = await readText('README.md');
const changelogSource = await readText('CHANGELOG.md');
const serverMetadata = await readJson('server/version.json');

const literalCurrentVersion = releaseSource.match(/CURRENT_VERSION\s*=\s*['"]([^'"]+)['"]/u)?.[1];
const frontendUsesPackageVersion =
  /from\s+['"]\.\.\/\.\.\/package\.json['"]/u.test(releaseSource)
  && /CURRENT_VERSION\s*=\s*packageVersion/u.test(releaseSource);
const frontendVersion = frontendUsesPackageVersion ? packageJson.version : literalCurrentVersion;

const literalGradleVersion = gradleSource.match(/appVersionName\s*=.*?\?:\s*['"]([^'"]+)['"]/u)?.[1];
const gradleUsesPackageVersion = /appVersionName\s*=.*?packageInfo\.version/u.test(gradleSource);
const gradleVersion = gradleUsesPackageVersion ? packageJson.version : literalGradleVersion;

const apiPort = 39000 + (process.pid % 1000);
const apiProcess = spawn(process.execPath, ['server/apiServer.js'], {
  cwd: rootDir,
  env: { ...process.env, PORT: String(apiPort) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let apiInfo;
let lastApiError;
let apiStderr = '';
apiProcess.stderr.on('data', chunk => { apiStderr += chunk.toString(); });
try {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${apiPort}/api/app/version`);
      if (response.ok) {
        apiInfo = await response.json();
        break;
      }
    } catch (err) {
      lastApiError = err;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
} finally {
  apiProcess.kill();
  if (!apiInfo && (lastApiError || apiStderr)) {
    console.warn(`[WARN] API check noticed: ${lastApiError?.message || ''} Stderr: ${apiStderr}`);
  }
}

const versions = {
  package: packageJson.version,
  packageLock: packageLock.version,
  packageLockRoot: packageLock.packages?.['']?.version,
  frontend: frontendVersion,
  api: apiInfo?.latestVersion,
  android: gradleVersion,
};

for (const [source, version] of Object.entries(versions)) {
  console.log(`${source.padEnd(15)} ${version ?? '<indisponível>'}`);
}

const failures = Object.entries(versions)
  .filter(([, version]) => version !== packageJson.version)
  .map(([source, version]) => `${source}=${version ?? '<indisponível>'}`);

const currentReleaseBindings = releaseSource.match(/version:\s*CURRENT_VERSION/gu) ?? [];
if (!/export const RELEASES[^=]*=\s*\[\s*\{\s*version:\s*CURRENT_VERSION/su.test(releaseSource)
  || currentReleaseBindings.length !== 1) {
  failures.push('somente a primeira release deve derivar de CURRENT_VERSION');
}

if (/VERSION_CODE:\s*\$\{\{\s*github\.run_number\s*\}\}/u.test(workflowSource)) {
  failures.push('o versionCode Android ainda depende de github.run_number');
}

if (!viteSource.includes("version as appVersion } from './package.json'")) {
  failures.push('o manifesto do bundle Web não deriva do package.json');
}

if (!workflowSource.includes('assets/public/app-version.json') || !workflowSource.includes('dump badging')) {
  failures.push('o workflow não valida a versão interna do APK');
}

if (!packageJson.scripts?.build?.includes('verify:build-version')) {
  failures.push('o build não valida o manifesto de versão gerado');
}

if (!deploySource.includes('status --porcelain')
  || !deploySource.includes('rev-list -n 1')
  || !deploySource.includes('/app-version.json')) {
  failures.push('o deploy não contém todas as barreiras de consistência');
}

if (Object.hasOwn(serverMetadata, 'version')
  || Object.hasOwn(serverMetadata, 'latestVersion')
  || Object.hasOwn(serverMetadata, 'downloadUrl')) {
  failures.push('server/version.json voltou a declarar uma versão independente');
}

if (!readmeSource.includes(`Finly \`v${packageJson.version}\``)
  || !readmeSource.includes(`version-${packageJson.version}-purple`)) {
  failures.push('README não acompanha a versão oficial');
}

const changelogVersion = changelogSource.match(/^## \[([^\]]+)\]/mu)?.[1];
if (changelogVersion !== packageJson.version) {
  failures.push(`CHANGELOG=${changelogVersion ?? '<indisponível>'}`);
}

if (failures.length > 0) {
  console.error(`\nVersões dessincronizadas: ${failures.join('; ')}`);
  process.exitCode = 1;
} else {
  console.log(`\nOK: todas as plataformas derivam da versão ${packageJson.version}.`);
}
