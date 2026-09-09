import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async relativePath => JSON.parse(
  await readFile(path.join(rootDir, relativePath), 'utf8'),
);

const packageInfo = await readJson('package.json');
const builtInfo = await readJson('dist/app-version.json');

if (builtInfo.version !== packageInfo.version) {
  throw new Error(
    `Bundle Web fora de sincronia: package=${packageInfo.version}; bundle=${builtInfo.version ?? '<indisponível>'}`,
  );
}

console.log(`OK: bundle Web gerado com a versão ${builtInfo.version}.`);
