import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const optionPickerCode = read('src/components/ui/OptionPicker.tsx');
const transactionModal = read('src/components/transactions/TransactionModalV2.tsx');
const splitEditor = read('src/components/transactions/TransactionSplitEditor.tsx');

// 1. Validação da estrutura do OptionPicker
assert.match(optionPickerCode, /export function OptionPicker/u, 'OptionPicker deve exportar a função principal');
assert.match(optionPickerCode, /createPortal/u, 'OptionPicker deve utilizar portal para renderizar dentro do DOM');
assert.match(optionPickerCode, /role="listbox"/u, 'OptionPicker deve ter atributo de acessibilidade role=listbox');
assert.match(optionPickerCode, /rounded-t-\[28px\]/u, 'OptionPicker deve suportar visual Bottom Sheet moderno no mobile');
assert.match(optionPickerCode, /normalizeSearch/u, 'OptionPicker deve filtrar ignorando acentos');
assert.match(optionPickerCode, /activeRadioClasses/u, 'OptionPicker deve ter indicador de rádio integrado');
assert.doesNotMatch(optionPickerCode, /searchInputRef\.current\.focus\(\)/u, 'OptionPicker não deve focar o input automaticamente para evitar subir o teclado no Android');

// 2. Validação da remoção dos selects nativos no TransactionModalV2
assert.match(transactionModal, /<OptionPicker[^>]*title="Escolher Categoria"/u, 'Modal deve usar OptionPicker para Categoria');
assert.match(transactionModal, /<OptionPicker[^>]*title="Cartão de Crédito"/u, 'Modal deve usar OptionPicker para Cartão de Crédito');
assert.match(transactionModal, /<OptionPicker[^>]*title="Fatura de Destino"/u, 'Modal deve usar OptionPicker para Fatura de Destino');
assert.match(transactionModal, /<OptionPicker[^>]*title="Conta Bancária"/u, 'Modal deve usar OptionPicker para Conta Bancária');
assert.match(transactionModal, /<OptionPicker[^>]*title="Conta de Origem"/u, 'Modal deve usar OptionPicker para Conta de Origem');
assert.match(transactionModal, /<OptionPicker[^>]*title="Conta de Destino"/u, 'Modal deve usar OptionPicker para Conta de Destino');

// 3. Validação no SplitEditor
assert.match(splitEditor, /<OptionPicker[^>]*title="Escolher Categoria"/u, 'SplitEditor deve usar OptionPicker para Categoria');

console.log('OK: OptionPicker integrado com sucesso ao Finly Design System, eliminando diálogos nativos do Android.');
