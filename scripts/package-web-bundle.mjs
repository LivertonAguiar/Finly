/**
 * Finly Web Bundle Packager for OTA / Live Updates
 * Compresses the `dist` directory into a standalone ZIP bundle,
 * calculates SHA-256 integrity checksum, updates `server/manifest.json`,
 * and places the ZIP inside `server/public/bundles/`.
 *
 * Usage:
 *   node scripts/package-web-bundle.mjs [--version <webVersion>] [--min-native <minNativeVersion>] [--mandatory]
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const manifestPath = path.join(rootDir, 'server', 'manifest.json');
const bundlesDir = path.join(rootDir, 'server', 'public', 'bundles');
const packageJsonPath = path.join(rootDir, 'package.json');

// Ensure dist directory exists
if (!existsSync(distDir)) {
  console.error('❌ Diretório dist/ não encontrado. Execute npm run build antes de empacotar o bundle.');
  process.exit(1);
}

if (!existsSync(bundlesDir)) {
  mkdirSync(bundlesDir, { recursive: true });
}

// Read current versions
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const nativeVersion = pkg.version;

let manifest = {
  native: {
    version: nativeVersion,
    minimumVersion: '1.1.0',
    downloadUrl: `https://github.com/LivertonAguiar/Finly/releases/download/v${nativeVersion}/finly-v${nativeVersion}.apk`,
  },
  web: {
    version: nativeVersion,
    minNativeVersion: nativeVersion,
    bundleUrl: '',
    sha256: '',
    mandatory: false,
    releaseDate: new Date().toISOString().split('T')[0],
    notes: 'Atualização OTA do bundle web do Finly.',
  },
};

if (existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (_) {}
}

// Parse command line arguments
const args = process.argv.slice(2);
let targetWebVersion = null;
let minNativeVersion = nativeVersion;
let mandatory = false;
let notes = manifest.web?.notes || 'Atualização de estabilidade e melhorias no bundle web do Finly.';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--version' && args[i + 1]) {
    targetWebVersion = args[i + 1];
    i++;
  } else if (args[i] === '--min-native' && args[i + 1]) {
    minNativeVersion = args[i + 1];
    i++;
  } else if (args[i] === '--mandatory') {
    mandatory = true;
  } else if (args[i] === '--notes' && args[i + 1]) {
    notes = args[i + 1];
    i++;
  }
}

// If no version specified, increment patch or sub-patch of webVersion
if (!targetWebVersion) {
  const currentWeb = manifest.web?.version || nativeVersion;
  const parts = currentWeb.split('.').map(p => parseInt(p, 10) || 0);
  if (parts.length === 3) {
    // e.g. 1.1.69 -> 1.1.69.1
    targetWebVersion = `${parts[0]}.${parts[1]}.${parts[2]}.1`;
  } else if (parts.length >= 4) {
    // e.g. 1.1.69.1 -> 1.1.69.2
    parts[parts.length - 1] += 1;
    targetWebVersion = parts.join('.');
  } else {
    targetWebVersion = `${nativeVersion}.1`;
  }
}

console.log(`📦 Empacotando bundle web OTA:`);
console.log(`   - Versão Web: v${targetWebVersion}`);
console.log(`   - Versão Nativa Mínima: v${minNativeVersion}`);
console.log(`   - Obrigatória: ${mandatory ? 'SIM' : 'NÃO'}`);

const zipFileName = `finly-bundle-v${targetWebVersion}.zip`;
const zipFilePath = path.join(bundlesDir, zipFileName);

// Create ZIP from dist/ using PowerShell Compress-Archive or tar -a
console.log(`⚡ Criando arquivo ZIP: ${zipFilePath}...`);
try {
  // Use PowerShell Compress-Archive for reliable zip creation on Windows
  const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipFilePath}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Falha ao criar arquivo ZIP:', err);
  process.exit(1);
}

// Calculate SHA-256
console.log(`🔒 Calculando hash de integridade SHA-256...`);
const zipBuffer = readFileSync(zipFilePath);
const sha256 = createHash('sha256').update(zipBuffer).digest('hex').toLowerCase();
console.log(`   SHA-256: ${sha256}`);

// Update manifest
const bundlePublicUrl = `https://finly.lpaguiar.com.br/bundles/${zipFileName}`;
manifest.native = {
  version: nativeVersion,
  minimumVersion: manifest.native?.minimumVersion || '1.1.0',
  downloadUrl: `https://github.com/LivertonAguiar/Finly/releases/download/v${nativeVersion}/finly-v${nativeVersion}.apk`,
};

manifest.web = {
  version: targetWebVersion,
  minNativeVersion,
  bundleUrl: bundlePublicUrl,
  sha256,
  mandatory,
  releaseDate: new Date().toISOString().split('T')[0],
  notes,
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`✅ Manifesto atualizado com sucesso em: ${manifestPath}`);
console.log(`🎉 Pacote OTA v${targetWebVersion} pronto para deploy!`);
