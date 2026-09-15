import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const bottomNav = readFileSync(
  path.join(process.cwd(), 'src/components/layout/BottomNav.tsx'),
  'utf8',
);

assert.match(bottomNav, /data-testid="quick-action-grid"/u);
assert.match(bottomNav, /grid grid-cols-2 gap-3/u);
assert.equal((bottomNav.match(/data-quick-action=/gu) || []).length, 4);
assert.equal((bottomNav.match(/min-h-\[96px\] rounded-3xl/gu) || []).length, 4);
assert.equal((bottomNav.match(/w-8 h-8 stroke-\[2\.4\]/gu) || []).length, 4);
assert.equal((bottomNav.match(/min-h-11 px-3 py-2 rounded-2xl/gu) || []).length, 4);
assert.match(bottomNav, /data-testid="mobile-bottom-navbar"/u);
assert.match(bottomNav, /h-\[52px\].*max-w-\[336px\]/u);
assert.equal((bottomNav.match(/w-11 h-11 rounded-full/gu) || []).length, 5);
assert.equal((bottomNav.match(/w-\[22px\] h-\[22px\] stroke-\[2\.2\]/gu) || []).length, 4);
assert.equal((bottomNav.match(/w-6 h-6 stroke-\[3\]/gu) || []).length, 2);

const order = ['income', 'expense', 'card_expense', 'transfer'].map(action =>
  bottomNav.indexOf(`data-quick-action="${action}"`),
);
assert.ok(order.every((position, index) => position >= 0 && (index === 0 || position > order[index - 1])));

console.log('OK: grade rápida com quatro cartões maiores, ícones ampliados e ordem preservada.');
