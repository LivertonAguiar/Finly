import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8');

const overviewTab = read('src/components/dashboard/OverviewTab.tsx');
const dashboardPage = read('src/components/dashboard/DashboardPage.tsx');
const transactionsPage = read('src/components/transactions/TransactionsPage.tsx');
const appTsx = read('src/App.tsx');

// 1. OverviewTab propaga o mês selecionado e o tipo de filtro ao clicar em despesas e receitas
assert.match(
  overviewTab,
  /onNavigateToTransactions\(\{\s*monthOffset:\s*selectedMonthOffset,\s*filterType:\s*'expense'\s*\}\)/u,
  'OverviewTab deve repassar monthOffset e filterType expense no clique do card de despesas',
);

assert.match(
  overviewTab,
  /onNavigateToTransactions\(\{\s*monthOffset:\s*selectedMonthOffset,\s*filterType:\s*'income'\s*\}\)/u,
  'OverviewTab deve repassar monthOffset e filterType income no clique do card de receitas',
);

// 2. DashboardPage faz o repasse transparente das propriedades
assert.match(dashboardPage, /selectedMonthOffset\?: number/u);
assert.match(dashboardPage, /onNavigateToTransactions\?: \(params\?: TransactionsNavParams\) => void/u);
assert.match(dashboardPage, /onNavigateToTransactions=\{onNavigateToTransactions\}/u);

// 3. TransactionsPage aceita o mês inicial e filtro via navegação
assert.match(transactionsPage, /initialNavParams\?: TransactionsNavParams \| null/u);
assert.match(transactionsPage, /selectedMonthOffset: controlledMonthOffset/u);
assert.match(transactionsPage, /initialNavParams\?\.monthOffset/u);
assert.match(transactionsPage, /initialNavParams\?\.filterType/u);

// 4. App.tsx gerencia o mês compartilhado e conecta o handler de navegação
assert.match(appTsx, /const \[sharedMonthOffset, setSharedMonthOffset\] = useState<number>\(0\);/u);
assert.match(appTsx, /const handleOpenTransactions = useCallback\(/u);
assert.match(appTsx, /selectedMonthOffset=\{sharedMonthOffset\}/u);
assert.match(appTsx, /onNavigateToTransactions=\{handleOpenTransactions\}/u);

console.log('OK: Sincronização do mês selecionado e filtro entre Dashboard e Transações validada com sucesso!');
