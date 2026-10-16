import assert from 'node:assert/strict';

// Set up mock localStorage and window for Node.js test runner
const originalWindow = (globalThis as any).window;
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

class MockCustomEvent {
  type: string;
  detail: any;
  constructor(type: string, params?: any) {
    this.type = type;
    this.detail = params?.detail;
  }
}

(globalThis as any).CustomEvent = MockCustomEvent;
(globalThis as any).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  document: {
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  CustomEvent: MockCustomEvent,
};
(globalThis as any).localStorage = localStorageMock;

async function run() {
  const {
    hashPin,
    legacyHashPin,
    setPinCode,
    verifyPinCode,
    isPinConfigured,
    removePinCode,
    getOrCreatePinSalt,
    getPinLockoutRemainingSeconds,
    resetFailedPinAttempts,
  } = await import('../src/utils/securityManager');

  console.log('🧪 Iniciando testes de segurança do PIN (PBKDF2, Salt e Força Bruta)...');

  storage.clear();

  // 1. Dynamic Salt Generation
  const salt1 = getOrCreatePinSalt();
  assert.ok(salt1 && salt1.length >= 16, 'Salt dinâmico deve ter pelo menos 16 caracteres hex');
  const salt2 = getOrCreatePinSalt();
  assert.equal(salt1, salt2, 'Salt deve ser preservado para a mesma instalação');
  console.log('✅ 1. Salt dinâmico por instalação validado com sucesso.');

  // 2. PBKDF2 Format
  const pbkdf2Hash = await hashPin('1234');
  assert.ok(pbkdf2Hash.startsWith('pbkdf2:'), 'Hash deve possuir prefixo pbkdf2');
  const parts = pbkdf2Hash.split(':');
  assert.equal(parts.length, 3, 'Formato deve ser pbkdf2:salt:hex');
  assert.equal(parts[1], salt1, 'Salt embutido no hash deve coincidir com o salt da instalação');
  console.log('✅ 2. Derivação de chave PBKDF2 e formato estruturado validados.');

  // 3. Set and Verify PIN
  await setPinCode('9876');
  assert.ok(isPinConfigured(), 'PIN deve estar configurado');
  const validRes = await verifyPinCode('9876');
  assert.equal(validRes.success, true, 'Verificação com PIN correto deve ter sucesso');

  const invalidRes = await verifyPinCode('0000');
  assert.equal(invalidRes.success, false, 'Verificação com PIN incorreto deve falhar');
  console.log('✅ 3. Configuração e verificação do PIN PBKDF2 validadas.');

  // 4. Legacy Migration (SHA-256 legado -> PBKDF2 automático)
  storage.clear();
  const legacyHash = await legacyHashPin('5544');
  storage.set('finly_pin_hash', legacyHash);
  storage.set('finly_pin_enabled', 'true');

  assert.equal(storage.get('finly_pin_hash'), legacyHash, 'Estado inicial deve conter hash legado SHA-256');
  const migrationRes = await verifyPinCode('5544');
  assert.equal(migrationRes.success, true, 'PIN legado deve autenticar com sucesso');

  const upgradedHash = storage.get('finly_pin_hash');
  assert.ok(upgradedHash && upgradedHash.startsWith('pbkdf2:'), 'Hash legado deve ser automaticamente migrado para PBKDF2');
  console.log('✅ 4. Migração transparente de PIN legado para PBKDF2 aprovada.');

  // 5. Brute-force Lockout Backoff Protection
  storage.clear();
  await setPinCode('1122');
  resetFailedPinAttempts();

  for (let i = 1; i <= 4; i++) {
    const res = await verifyPinCode('9999');
    assert.equal(res.success, false);
    assert.equal(res.locked, false, `Tentativa ${i} não deve bloquear ainda`);
  }

  // 5th failed attempt -> lock for 30 seconds
  const fifthAttempt = await verifyPinCode('9999');
  assert.equal(fifthAttempt.success, false);
  assert.equal(fifthAttempt.locked, true, 'Quinta tentativa incorreta deve ativar bloqueio');
  assert.ok(fifthAttempt.remainingSeconds && fifthAttempt.remainingSeconds > 0);

  // While locked, even correct PIN is rejected
  const attemptWhileLocked = await verifyPinCode('1122');
  assert.equal(attemptWhileLocked.success, false, 'Tentativa durante bloqueio deve ser rejeitada');
  assert.equal(attemptWhileLocked.locked, true);

  console.log('✅ 5. Proteção contra força bruta com bloqueio temporário aprovada.');

  // 6. Reset PIN
  removePinCode();
  assert.equal(isPinConfigured(), false);
  assert.equal(getPinLockoutRemainingSeconds(), 0);
  console.log('✅ 6. Remoção segura de PIN e limpeza de contadores aprovadas.');

  console.log('🎉 TODOS OS TESTES DE CRIPTOGRAFIA DO PIN FORAM APROVADOS COM 100% DE SUCESSO!');
}

run()
  .then(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).localStorage = originalLocalStorage;
  })
  .catch(err => {
    console.log('FALHA DETECTADA:', err.message || err);
    process.exit(1);
  });
