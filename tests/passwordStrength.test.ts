import assert from 'node:assert/strict';
import { calculatePasswordStrength } from '../src/utils/passwordStrength';

console.log('🧪 Iniciando testes do medidor de força de senha...');

// 1. Vazio
const empty = calculatePasswordStrength('');
assert.equal(empty.score, 0);

// 2. Fraca (apenas minúsculas ou curto)
const weak = calculatePasswordStrength('12345');
assert.equal(weak.score, 1);
assert.equal(weak.label, 'Fraca');

// 3. Razoável (comprimento e números)
const fair = calculatePasswordStrength('senha123');
assert.equal(fair.score, 2);
assert.equal(fair.label, 'Razoável');

// 4. Boa (comprimento, maiúsculas/minúsculas e números)
const good = calculatePasswordStrength('Senha123');
assert.equal(good.score, 3);
assert.equal(good.label, 'Boa');

// 5. Muito Forte (comprimento, maiúsculas/minúsculas, números e símbolo especial)
const strong = calculatePasswordStrength('Finly@2026Secure!');
assert.equal(strong.score, 4);
assert.equal(strong.label, 'Muito Forte');
assert.equal(strong.suggestions.length, 0);

console.log('✅ Medidor de força de senha validado com 100% de precisão!');
