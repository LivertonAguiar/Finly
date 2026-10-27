import assert from 'node:assert/strict';
import { syncNativeWidget, checkNativeQuickAction } from '../src/utils/widgetBridge';

async function runTests() {
  // 1. Em ambiente não-nativo (Web / Node.js), a sincronização do widget é um no-op seguro
  const syncResult = await syncNativeWidget({
    balance: 14250.75,
    monthlyExpenses: 3820.50,
    pendingBillsCount: 3,
    monthName: 'out. de 2026',
    currency: 'BRL',
  });
  assert.equal(syncResult, false, 'Em ambiente web, syncNativeWidget deve retornar false sem lançar exceções');

  // 2. Consulta de ação rápida em ambiente não-nativo deve retornar null
  const quickAction = await checkNativeQuickAction();
  assert.equal(quickAction, null, 'Em ambiente web, checkNativeQuickAction deve retornar null');

  console.log('OK: widgetBridge lida de forma segura e não-bloqueante fora do ambiente nativo.');
}

runTests().catch(err => {
  console.error('Falha nos testes de widgetBridge:', err);
  process.exit(1);
});
