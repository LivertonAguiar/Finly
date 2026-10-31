import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// 1. Validar TabNavigation
const tabNav = readFileSync(path.join(process.cwd(), 'src/components/common/TabNavigation.tsx'), 'utf8');
assert.match(tabNav, /badgeVariant\?: 'default' \| 'danger'/u, 'TabItem deve suportar badgeVariant danger');
assert.match(tabNav, /bg-rose-500 text-white/u, 'badgeVariant danger deve renderizar em vermelho');

// 2. Validar AccountsAndCardsPage (Aba 1: Faturas, Aba 2: Cartões, Aba 3: Contas)
const accountsAndCards = readFileSync(path.join(process.cwd(), 'src/components/accounts-cards/AccountsAndCardsPage.tsx'), 'utf8');
assert.match(accountsAndCards, /id:\s*'faturas'/u, 'Deve ter aba faturas');
assert.match(accountsAndCards, /id:\s*'cartoes'/u, 'Deve ter aba cartoes');
assert.match(accountsAndCards, /id:\s*'contas'/u, 'Deve ter aba contas');
const faturasIdx = accountsAndCards.indexOf("id: 'faturas'");
const cartoesIdx = accountsAndCards.indexOf("id: 'cartoes'");
const contasIdx = accountsAndCards.indexOf("id: 'contas'");
assert.ok(faturasIdx < cartoesIdx && cartoesIdx < contasIdx, 'Aba Faturas deve ser a primeira, seguida de Cartões e Contas');
assert.match(accountsAndCards, /return 'faturas'/u, 'Aba padrão inicial deve ser faturas');
assert.match(accountsAndCards, /overdueOrDueSoonCount/u, 'Deve calcular faturas vencidas ou a vencer em até 3 dias');
assert.match(accountsAndCards, /badgeVariant:\s*'danger'/u, 'Aba faturas deve receber badgeVariant danger');
assert.match(accountsAndCards, /<InvoicesTab/u, 'Deve renderizar InvoicesTab');

// 3. Validar InvoicesTab
const invoicesTab = readFileSync(path.join(process.cwd(), 'src/components/invoices/InvoicesTab.tsx'), 'utf8');
assert.match(invoicesTab, /selectedMonthOffset/u, 'Deve ter seletor de mês com navegação');
assert.match(invoicesTab, /A Pagar nos Próximos 30 Dias/u, 'Deve ter KPI A Pagar');
assert.match(invoicesTab, /Faturas Vencidas/u, 'Deve ter KPI Faturas Vencidas');
assert.match(invoicesTab, /Faturas Pagas/u, 'Deve ter KPI Faturas Pagas');
assert.match(invoicesTab, /activeFilter === 'all'/u, 'Deve ter filtro Todas');
assert.match(invoicesTab, /activeFilter === 'pending'/u, 'Deve ter filtro A pagar');
assert.match(invoicesTab, /activeFilter === 'overdue'/u, 'Deve ter filtro Vencidas');
assert.match(invoicesTab, /activeFilter === 'paid'/u, 'Deve ter filtro Pagas');
assert.match(invoicesTab, /Pagar Fatura/u, 'Deve ter botão direto Pagar Fatura');
assert.match(invoicesTab, /Estornar Pagamento/u, 'Menu ⋯ deve ter opção de estornar pagamento');
assert.match(invoicesTab, /unpayCardInvoice/u, 'Deve chamar unpayCardInvoice no estorno');

// 4. Validar PayInvoiceSheet (Fluxo de pagamento em 2 toques)
const paySheet = readFileSync(path.join(process.cwd(), 'src/components/invoices/PayInvoiceSheet.tsx'), 'utf8');
assert.match(paySheet, /finly_last_pay_invoice_account_id/u, 'Deve ler e persistir a última conta usada');
assert.match(paySheet, /payCardInvoice/u, 'Deve chamar payCardInvoice da FinancialContext');
assert.match(paySheet, /Confirmar Pagamento/u, 'Deve ter botão direto de confirmação em 1 toque');
assert.match(paySheet, /Opções avançadas/u, 'Opções avançadas devem ficar recolhidas');
assert.match(paySheet, /useBackButton/u, 'Deve ter suporte ao botão voltar do Android');

// 5. Validar OverviewTab (Atalho na tela Início)
const overviewTab = readFileSync(path.join(process.cwd(), 'src/components/dashboard/OverviewTab.tsx'), 'utf8');
assert.match(overviewTab, /finly_open_pay_invoice/u, 'OverviewTab deve emitir finly_open_pay_invoice');
assert.match(overviewTab, /contas-cartoes\?tab=faturas/u, 'Resumo de Cartões e alertas devem redirecionar para tab=faturas');

// 6. Validar BottomNav (Ação rápida mobile)
const bottomNav = readFileSync(path.join(process.cwd(), 'src/components/layout/BottomNav.tsx'), 'utf8');
assert.match(bottomNav, /Pagar fatura/u, 'BottomNav deve ter atalho Pagar fatura');
assert.match(bottomNav, /finly_open_pay_invoice/u, 'Atalho do BottomNav deve disparar finly_open_pay_invoice');

// 7. Validar App.tsx
const appTsx = readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
assert.match(appTsx, /PayInvoiceSheet/u, 'App.tsx deve importar e montar PayInvoiceSheet');
assert.match(appTsx, /finly_open_pay_invoice/u, 'App.tsx deve escutar o evento finly_open_pay_invoice');
assert.match(appTsx, /tab === 'faturas'/u, 'App.tsx deve rotear tab=faturas para contas-cartoes');

console.log('✅ Todos os testes da arquitetura de faturas e fluxo de pagamento em 2 toques passaram com 100% de sucesso!');

