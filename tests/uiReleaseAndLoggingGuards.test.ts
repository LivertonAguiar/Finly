import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const transactionModal = read('src/components/transactions/TransactionModalV2.tsx');
const splitEditor = read('src/components/transactions/TransactionSplitEditor.tsx');
const picker = read('src/components/ui/SubcategoryPicker.tsx');
const apiServer = read('server/apiServer.js');
const workflow = read('.github/workflows/build-apk.yml');
const deployVps = read('scripts/deploy-vps.ps1');

for (const removedControl of [
  'Natureza Financeira (Patrimonial / Contábil)',
  'Propriedades Especiais',
  'Escopo do Lançamento:',
  'Necessidade do Gasto (Orçamento 50-30-20)',
]) {
  assert.equal(
    transactionModal.includes(removedControl),
    false,
    `o lançamento ainda expõe o controle técnico: ${removedControl}`,
  );
}

assert.equal(
  splitEditor.includes('Natureza Contábil:'),
  false,
  'o detalhamento ainda pede que o usuário defina natureza contábil',
);
assert.match(transactionModal, /<SubcategoryPicker/u);
assert.match(splitEditor, /<SubcategoryPicker/u);
assert.match(picker, /Buscar subcategoria/u);
assert.match(picker, /role="listbox"/u);
assert.match(picker, /overflow-y-auto/u);
assert.match(picker, /Exibindo \{filteredSubcategories\.length\} de \{subcategories\.length\}/u);

assert.doesNotMatch(apiServer, /JSON\.stringify\(sanitizedBody\)/u);
assert.doesNotMatch(apiServer, /- Body:/u);
assert.match(apiServer, /Object\.keys\(req\.body\)/u);

assert.match(workflow, /ASSET_URL=/u);
assert.match(workflow, /release ou o APK oficial está ausente/u);
assert.match(workflow, /Confirmar APK Oficial Publicado/u);
assert.match(workflow, /if: github\.event_name != 'pull_request'/u);
assert.match(workflow, /actions\/checkout@v5/u);
assert.match(workflow, /actions\/setup-node@v5/u);
assert.match(workflow, /actions\/setup-java@v5/u);
assert.doesNotMatch(workflow, /android-actions\/setup-android/u);
assert.match(workflow, /Validar Android SDK do Runner/u);
assert.match(workflow, /ANDROID_SDK_ROOT=\$SDK_ROOT/u);

assert.match(deployVps, /Get-FileHash/u);
assert.match(deployVps, /bundle OTA difere do manifesto/u);
assert.match(deployVps, /server\/public\/bundles\/\$bundleFileName/u);
assert.match(deployVps, /bundle OTA nao esta publicamente acessivel/u);

console.log('OK: formulário enxuto, seletor completo, logs seguros e workflow verificável.');
