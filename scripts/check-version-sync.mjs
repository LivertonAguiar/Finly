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

const literalCurrentVersion = releaseSource.match(/CURRENT_VERSION\s*=\s*['"]([^'"]+)['"]/u)?.[1];
const frontendUsesPackageVersion =
  /from\s+['"]\.\.\/\.\.\/package\.json['"]/u.test(releaseSource)
  && /CURRENT_VERSION\s*=\s*packageVersion/u.test(releaseSource);
const frontendVersion = frontendUsesPackageVersion ? packageJson.version : literalCurrentVersion;

const literalGradleVersion = gradleSource.match(/appVersionName\s*=.*?\?:\s*['"]([^'"]+)['"]/u)?.[1];
const gradleUsesPackageVersion = /appVersionName\s*=.*?packageInfo\.version/u.test(gradleSource);
const gradleVersion = gradleUsesPackageVersion ? packageJson.version : literalGradleVersion;

const apiPort = 39041;
const apiProcess = spawn(process.execPath, ['server/apiServer.js'], {
  cwd: rootDir,
  env: { ...process.env, PORT: String(apiPort) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let apiInfo;
try {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${apiPort}/api/app/version`);
      if (response.ok) {
        apiInfo = await response.json();
        break;
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
} finally {
  apiProcess.kill();
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

if (!/version:\s*CURRENT_VERSION/u.test(releaseSource)) {
  failures.push('a versão da release atual não deriva de CURRENT_VERSION');
}

if (/VERSION_CODE:\s*\$\{\{\s*github\.run_number\s*\}\}/u.test(workflowSource)) {
  failures.push('o versionCode Android ainda depende de github.run_number');
}

if (failures.length > 0) {
  console.error(`\nVersões dessincronizadas: ${failures.join('; ')}`);
  process.exitCode = 1;
} else {
  console.log(`\nOK: todas as plataformas derivam da versão ${packageJson.version}.`);
}
