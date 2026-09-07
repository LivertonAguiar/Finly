# ADR-002: Alocação de Cartão de Crédito e Regimes de Caixa vs Competência

## Status
Accepted

## Date
2026-08-31

## Contexto
Diferente de despesas comuns à vista, despesas de cartão de crédito possuem ciclos complexos (data da compra, dia do fechamento da fatura, dia de vencimento, parcelamento em múltiplos meses e limite compartilhado).

## Decisão
Implementamos a biblioteca especializada `src/utils/invoiceCalculator.ts`:
1. **Alocação de Faturas**: Compras após o dia do fechamento são automaticamente projetadas para a fatura do mês seguinte.
2. **Duplo Regime Contábil**:
   * **Regime de Competência**: A transação é indexada por `purchaseDate` para relatórios de comportamento de consumo.
   * **Regime de Caixa**: A transação é projetada por `dueDate` para controle de fluxo de caixa e saldo bancário real.
3. **Rastreamento de Séries de Parcelamento**: Parcelas utilizam metadados `installments: { current, total, parentId }` permitindo visualização de progresso e cálculo correto de limite disponível.

## Consequências
* Alinhamento estrito com princípios contábeis de conciliação bancária e faturas.
* Elimina divergências entre o extrato bancário e o saldo previsto de fechamento de mês.
