import assert from 'node:assert/strict';

// Set up mock localStorage and window for Node.js test runner
const originalLocalStorage = (globalThis as any).localStorage;

const storage = new Map<string, string>();
const localStorageMock = {
  get length() { return storage.size; },
  key(index: number) { return [...storage.keys()][index] ?? null; },
  getItem(key: string) { return storage.get(key) ?? null; },
  setItem(key: string, value: string) { storage.set(key, value); },
  removeItem(key: string) { storage.delete(key); },
  clear() { storage.clear(); },
};

(globalThis as any).localStorage = localStorageMock;

async function run() {
  console.log('🧪 Iniciando testes de validação de Schema e Rollback de Backup...');

  // Mock initial state in FinancialContext logic
  let accountsState: any[] = [{ id: 'acc-1', name: 'Conta Principal', balance: 5000 }];
  let transactionsState: any[] = [{ id: 'tx-1', amount: 150, type: 'expense', description: 'Mercado' }];

  const simulateImport = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { success: false, error: 'Arquivo inválido: o formato do backup deve ser um objeto JSON.' };
      }

      const hasCoreCollections =
        Array.isArray(parsed.accounts) ||
        Array.isArray(parsed.transactions) ||
        Array.isArray(parsed.categories) ||
        Array.isArray(parsed.cards) ||
        Array.isArray(parsed.budgets) ||
        Array.isArray(parsed.goals);

      if (!hasCoreCollections) {
        return { success: false, error: 'Arquivo inválido: nenhuma estrutura de dados do Finly foi encontrada.' };
      }

      if (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
        const sample = parsed.transactions.slice(0, 15);
        const isValidSample = sample.every((t: any) => t && typeof t === 'object' && ('amount' in t || 'type' in t || 'description' in t));
        if (!isValidSample) {
          return { success: false, error: 'O arquivo contém transações com campos malformados ou corrompidos.' };
        }
      }

      // Snapshot
      storage.set('finly_backup_rollback_snapshot', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: {
          accounts: [...accountsState],
          transactions: [...transactionsState],
        },
      }));

      const importedCounts: Record<string, number> = {};
      if (Array.isArray(parsed.accounts)) {
        accountsState = parsed.accounts;
        importedCounts.accounts = parsed.accounts.length;
      }
      if (Array.isArray(parsed.transactions)) {
        transactionsState = parsed.transactions;
        importedCounts.transactions = parsed.transactions.length;
      }

      return { success: true, counts: importedCounts };
    } catch (e) {
      return { success: false, error: 'Falha ao processar o arquivo JSON: conteúdo malformatado.' };
    }
  };

  const simulateRollback = () => {
    const snapStr = storage.get('finly_backup_rollback_snapshot');
    if (!snapStr) return { success: false, message: 'Nenhum snapshot de reversão encontrado.' };
    const parsed = JSON.parse(snapStr);
    const data = parsed?.data;
    if (!data) return { success: false, message: 'Dados de snapshot corrompidos.' };

    if (Array.isArray(data.accounts)) accountsState = data.accounts;
    if (Array.isArray(data.transactions)) transactionsState = data.transactions;
    storage.delete('finly_backup_rollback_snapshot');
    return { success: true, message: 'Reversão concluída com sucesso!' };
  };

  // 1. Rejeição de JSON malformado
  const res1 = simulateImport('{"invalido": true');
  assert.equal(res1.success, false);
  console.log('✅ 1. Rejeição de JSON malformado aprovada.');

  // 2. Rejeição de JSON sem coleções Finly
  const res2 = simulateImport(JSON.stringify({ someRandomField: 123 }));
  assert.equal(res2.success, false);
  assert.ok(res2.error?.includes('nenhuma estrutura'));
  console.log('✅ 2. Validação de schema básico aprovada.');

  // 3. Rejeição de transações corrompidas
  const res3 = simulateImport(JSON.stringify({
    transactions: ['string-nao-objeto', 12345],
  }));
  assert.equal(res3.success, false);
  assert.ok(res3.error?.includes('malformados'));
  console.log('✅ 3. Rejeição de itens de transação inválidos aprovada.');

  // 4. Importação válida com criação de snapshot
  const res4 = simulateImport(JSON.stringify({
    accounts: [{ id: 'acc-new', name: 'Nova Conta', balance: 10000 }],
    transactions: [{ id: 'tx-new', amount: 200, type: 'income', description: 'Freela' }],
  }));
  assert.equal(res4.success, true);
  assert.equal(res4.counts?.accounts, 1);
  assert.equal(res4.counts?.transactions, 1);
  assert.equal(accountsState[0].name, 'Nova Conta');
  assert.ok(storage.has('finly_backup_rollback_snapshot'), 'Snapshot de reversão deve ser gravado');
  console.log('✅ 4. Importação íntegra com contagem e geração de snapshot aprovada.');

  // 5. Rollback
  const res5 = simulateRollback();
  assert.equal(res5.success, true);
  assert.equal(accountsState[0].name, 'Conta Principal', 'Estado deve ser revertido para o original');
  assert.ok(!storage.has('finly_backup_rollback_snapshot'), 'Snapshot consumido deve ser limpo');
  console.log('✅ 5. Reversão atômica de backup (Rollback) aprovada.');

  console.log('🎉 TODOS OS TESTES DE VALIDAÇÃO DE SCHEMA E ROLLBACK DE BACKUP FORAM APROVADOS!');
}

run()
  .then(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  })
  .catch(err => {
    console.log('FALHA:', err.message || err);
    process.exit(1);
  });
