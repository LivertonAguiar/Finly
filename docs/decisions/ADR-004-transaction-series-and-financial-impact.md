# ADR-004: Entidade Explícita de Séries de Transações e Separação de Impacto Financeiro vs. Analítico

## Status
Accepted

## Date
2026-09-12

## Contexto
No modelo anterior do Finly:
1. Compras parceladas de cartão de crédito não suportavam cadastro de compras já em andamento (ex.: `05/12`), obrigando a criação fictícia de parcelas anteriores ou cálculos incorretos de total.
2. Não havia agrupamento estável por ID único de série; operações usavam heurística frágil por descrição ou cartão, arriscando misturar compras homônimas no mesmo cartão (ex.: compras separadas na "Amazon").
3. Despesas fixas recorrentes utilizavam apenas flags booleanas (`recurring`, `recurrenceFrequency`), impedindo variações mensais de valor (ex.: conta de luz ou internet) e escopos cirúrgicos de edição/exclusão.
4. O campo `ignored` era sobrecarregado para compras de terceiros, parcelas antigas e exclusão manual do orçamento, misturando obrigação financeira real (fatura/limite do cartão) com participação em relatórios analíticos pessoais.

## Decisão
1. **Entidade Explícita de Série (`transaction_series`)**:
   - Criamos uma tabela/coleção dedicada `transaction_series` (com tipos discriminados `card_installment` e `recurring_expense`) com ID estável e campos canônicos.
   - Apenas ocorrências reais e ativas no Finly são persistidas como registros em `transactions` (com `series_id`, `series_sequence` e `occurrence_key`).
   - Para compras em andamento (ex.: `05/12`), são materializadas apenas as parcelas 05 a 12. As parcelas 01 a 04 são sintetizadas exclusivamente em tempo de exibição na linha do tempo do detalhe como `historical_paid`, sem nunca existirem como transações financeiras.
2. **Separação Estrita de Impactos via Seletores Puros (`src/utils/transactionImpact.ts`)**:
   - **Impacto Financeiro Real**: compras de cartão pertencem à fatura e consomem limite independentemente de flags analíticas (`isIncludedInCardInvoice`, `isIncludedInCardLimit`).
   - **Impacto Analítico Pessoal**: compras de terceiro (`isThirdParty`), reembolsos e despesas ignoradas são filtradas exclusivamente de orçamentos, gráficos e relatórios (`isIncludedInPersonalAnalytics`).
3. **Escopos Determinísticos de Exclusão e Edição (`src/utils/transactionSeriesScope.ts`)**:
   - Exclusão suporta: *Somente esta*, *Esta e as futuras*, e *Série inteira* (com confirmação reforçada para séries com itens pagos ou histórico).
   - Edição de despesa fixa permite *Somente este mês* (criação de exceção sem afetar regras padrão) ou *Este e os próximos* (nova regra com vigência temporal preservando exceções).

## Consequências
- **Positivas**:
  - Eliminação de transações fantasmas nos meses passados ao importar ou cadastrar parcelas existentes.
  - Soma monetária exata das parcelas (centavos residuais alocados na última parcela).
  - Isolamento de compras de terceiros que afetam a fatura real do cartão, permitindo fluxo de reembolso rastreável e parcial em 1-clique sem distorcer o fluxo de caixa pessoal.
  - Compatibilidade com registros legados sem forçar migrações heurísticas arriscadas.
- **Negativas/Compromissos**:
  - Necessidade de manter a nova tabela `transaction_series` no Supabase e na rotina de sincronização de store do usuário.
  - Manutenção temporária de flags booleanas legadas durante a janela de transição.

## Alternativas Rejeitadas
1. **Criação de parcelas históricas com `ignored: true`**:
   - *Motivo da rejeição*: poluía o banco de dados e meses anteriores com dezenas de transações artificiais, arriscando falhas de conciliação e divergências de relatórios.
2. **Duplicação de templates de recorrência em cada transação**:
   - *Motivo da rejeição*: redundância de dados e inconsistência quando o usuário editasse uma ocorrência no meio da série.
3. **Detecção e agrupamento permanente por descrição e cartão**:
   - *Motivo da rejeição*: frágil e perigoso; duas compras de valor ou descrição idênticos no mesmo cartão acabariam sendo deletadas ou editadas em lote por acidente.
4. **Uma única flag para representar histórico, terceiro e exclusão manual**:
   - *Motivo da rejeição*: acoplamento semântico que impedia diferenciar uma dívida real de cartão feita para outrem de um gasto pessoal oculto do orçamento.
