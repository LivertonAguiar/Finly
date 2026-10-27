---
description: 'Diretrizes de resiliência, integridade de dados e arquitetura contínua do Finly'
applyTo: '**/*.{ts,tsx,js,jsx,json}'
---

# Finly Resilience & State Management Memory

Ao desenvolver ou alterar componentes de estado e transações no Finly:

1. **Reconciliação e Estado Remoto vs Local**:
   - Transações modificadas localmente (como status pago/pendente via `toggleTransactionStatus`) devem sempre ser registradas no diário de mutações pendentes (`pendingTxMutationsRef` / `queueTransactionUpsert`) e salvas imediatamente via `supabaseDb.upsertTransaction`.
   - Snapshots remotos recebidos via pull-to-refresh (`refreshData`) nunca devem sobrescrever dados locais mais recentes enquanto houver mutações pendentes.

2. **Cálculo Derivado de Saldos (Prevenção de Flicker)**:
   - Saldos de contas bancárias dependem diretamente das transações registradas. Ao carregar ou atualizar a aplicação, calcule os saldos derivados com `calculateDerivedAccountBalances` ANTES de enviar o estado para o React (`setAccounts`), evitando oscilação rápida entre o saldo bruto do banco e o recalculado.

3. **Despesas de Séries e Composição (Splits)**:
   - Edições avulsas em ocorrências de séries recorrentes devem sempre carregar a propriedade `isSeriesException: true`. Sem essa flag, a rotina `reconcileRecurringExpenseSeries` re-projeta os templates padrão sobre a transação no próximo refresh.
   - Não reinjetar templates ausentes caso a ocorrência possua componentes próprios e seja uma exceção (`isSeriesException === true`).

4. **Políticas Invioláveis do Projeto**:
   - Proibido disparar e-mails para domínios fictícios (SMTP é o Gmail pessoal do mantenedor).
   - O APK Android é construído exclusivamente pelo GitHub Actions (`.github/workflows/build-apk.yml`).
