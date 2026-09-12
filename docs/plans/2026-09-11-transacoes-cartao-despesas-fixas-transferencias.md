# Plano de implementação — séries de cartão, despesas fixas, notificações e transferências

## 1. Estado e autorização

- Data do plano: 2026-09-11.
- Projeto: Finly Web/PWA e Android (Capacitor).
- Estado deste documento: pronto para execução por outro agente.
- Esta sessão está autorizada somente a produzir o plano. Nenhum código funcional, migration, versão, commit ou deploy deve ser executado nela.
- Na futura sessão de execução, o usuário autorizou o ciclo completo: implementação, validação, atualização de versão, commit, push, APK via GitHub Actions e deploy na VPS.
- Antes da execução, conferir novamente branch, worktree, versão e estado remoto. No momento da análise, `package.json` estava em `1.1.60`; se isso continuar verdadeiro e não existir outra política de versão concorrente, o próximo patch será `1.1.61`.

## 2. Fontes de verdade

As decisões funcionais abaixo vieram da entrevista concluída com o usuário. A conversa compartilhada foi usada apenas para levantar hipóteses e não prevalece sobre esta lista.

1. Informar `05/12` significa que 01–04 foram pagas antes do Finly e 05 está aberta.
2. O cadastro deve aceitar tanto valor total da compra quanto valor de cada parcela.
3. No modo “valor total”, a soma das parcelas deve ser exata; eventual residual de centavos fica na última parcela.
4. A “Fatura de Destino” é a autoridade para alocar a primeira parcela aberta.
5. As parcelas anteriores aparecem somente no detalhe/progresso da compra. Elas não aparecem como transações nos meses anteriores.
6. Parcelas históricas não afetam saldo, orçamento, relatórios, fluxo de caixa, faturas, limite ou notificações.
7. Exclusão de uma série oferece: somente esta, esta e futuras, ou série inteira.
8. “Série inteira” pode apagar pagas/históricas, mas exige confirmação reforçada com resumo do impacto.
9. A edição coletiva de compras parceladas não faz parte desta entrega; editar cartão continua alterando somente a parcela selecionada.
10. Despesa fixa permite editar somente esta ocorrência ou esta e as futuras. O histórico pago não é reescrito.
11. Despesas fixas suportadas: semanal, mensal e anual; diária não fará parte do novo fluxo.
12. A série pode ter data final opcional; sem ela, permanece ativa até cancelamento.
13. O horizonte visível/materializado será de 12 meses, renovado idempotentemente.
14. Ocorrência futura nasce `scheduled`; no período devido passa a `pending`; saldo bancário só muda quando fica `completed`.
15. Ocorrências futuras personalizadas são preservadas quando o padrão muda. Sobrescrevê-las exige confirmação explícita.
16. Lançamentos legados marcados como fixos devem ser migrados sem gerar histórico anterior ou duplicidades.
17. Compra de terceiro fica fora dos indicadores pessoais, mas continua na fatura e consumindo limite.
18. Reembolso de terceiro cria uma receita vinculada na conta escolhida e deve admitir valor parcial.
19. Despesa ignorada continua afetando a conta/cartão real, mas não orçamento, relatórios ou indicadores pessoais.
20. Lembrete individual existe somente para despesa comum e somente funciona quando ativado.
21. Compra de cartão não oferece lembrete individual; o aviso é exclusivamente da fatura consolidada.
22. Mesmo que uma despesa cadastrada vença no próprio dia, salvar a transação não deve disparar notificação imediata. O mecanismo agendado poderá avisar no ciclo/horário elegível posterior.
23. Corrigir a opção “No vencimento” para preservar `daysBefore = 0`.
24. Transferência terá formulário enxuto e unificado.
25. Transferência futura fica agendada e só movimenta saldos depois de confirmada.
26. Saldo insuficiente gera aviso, mas não bloqueia a transferência.
27. Séries antigas de cartão sem vínculo seguro não serão agrupadas automaticamente. Para elas, operações coletivas ficam indisponíveis.
28. A entrega deve manter comportamento equivalente na Web/PWA e no Android.

## 3. Resultado esperado

Ao final da implementação, o Finly deverá:

- cadastrar uma compra já em andamento, como `05/12`, sem criar lançamentos financeiros para 01–04;
- mostrar no detalhe “4 pagas antes do Finly · 05/12 aberta · 7 futuras”;
- preservar exatamente o regime de fatura escolhido e o total monetário informado;
- identificar cada série por ID estável, sem agrupar por descrição;
- excluir parcelas e ocorrências recorrentes pelo escopo escolhido;
- representar despesas fixas como série + ocorrências independentes, permitindo variação mensal;
- diferenciar impacto real em conta/cartão de participação em orçamento e relatórios;
- notificar compras de cartão apenas pela fatura e despesas comuns apenas por lembrete opt-in;
- unificar os dois formulários atuais de transferência;
- sincronizar criação, edição e exclusão sem ressuscitar dados após reload ou pull atrasado;
- atualizar a Central de Ajuda e publicar Web/APK segundo as regras operacionais do repositório.

## 4. Diagnóstico confirmado do estado atual

| Área | Estado atual | Consequência |
|---|---|---|
| Modelo | `Transaction.installments` já aceita `current`, `total` e `parentId` em `src/types/index.ts` | Existe um ponto de compatibilidade, mas a criação comum não preenche `parentId` |
| Criação parcelada | `TransactionModal.tsx` gera sempre `1/N`, uma transação por mês | Não é possível começar em `05/12` |
| Agrupamento | `TransactionDetailModal.tsx` usa `parentId` ou fallback por descrição + cartão | Compras homônimas podem ser misturadas |
| Valores | A divisão arredonda cada parcela independentemente | `R$ 100 / 3` pode não fechar exatamente R$ 100 |
| Datas | O avanço usa mutação mensal de `Date` | Dias 29–31 podem pular mês ou mudar o dia inesperadamente |
| Faturas | `CreditTab`, `PayInvoiceModal` e `FinancialContext` ainda usam `transaction.date` em caminhos relevantes | Pode divergir de `invoiceMonth`, fechamento e `dueDate` |
| Exclusão | Telas chamam `deleteTransaction(id)` | Sempre remove somente um lançamento, apesar de existir bulk delete no contexto |
| Recorrência | `recurring` e `recurrenceFrequency` são flags; não há template/reconciliador | Não existe “somente este mês” versus “este e futuros” |
| Alertas | Toda compra no cartão nasce `pending`; o bloco de contas usa `t.date` e não exclui `cardId` | Compra criada hoje dispara “vence hoje” |
| Lembrete | O formulário persiste `reminder`, mas o motor não o consulta | O botão não governa o alerta real |
| `daysBefore = 0` | A configuração usa fallback com `|| 3` | “No vencimento” vira três dias |
| Transferência | Há um modal completo e outro modal rápido com campos/categorias diferentes | Comportamento inconsistente e validações silenciosas |
| Agregações | Alguns cálculos filtram `ignored`, outros não | Dashboard, orçamento e relatórios podem divergir |
| Reembolso | Já cria uma receita, mas escolhe a primeira conta e usa o valor integral | Falta escolha de conta/data, vínculo explícito e parcialidade |
| Sync | Mutações de transação não participam integralmente do journal/guardas usados em outros domínios | GET/POST atrasado pode sobrescrever ou ressuscitar uma operação |
| Testes | Não há suíte dedicada a cartão comum, séries recorrentes, notificações ou transferências | Regressões críticas ficam sem cobertura |
| Helpdesk | Guias ainda descrevem fluxo, limite de parcelas, cores e FAQ antigos | A ajuda não representa a interface atual nem a planejada |

Arquivos-base do diagnóstico:

- `src/components/transactions/TransactionModal.tsx`
- `src/components/transactions/TransactionDetailModal.tsx`
- `src/components/transactions/TransactionsPage.tsx`
- `src/components/dashboard/CreditTab.tsx`
- `src/components/transactions/PayInvoiceModal.tsx`
- `src/components/contas/AccountsPage.tsx` ou o caminho vigente de `AccountsPage.tsx`
- `src/context/FinancialContext.tsx`
- `src/utils/invoiceCalculator.ts`
- `src/utils/notificationEngine.ts`
- `src/services/supabaseDb.ts`
- `src/utils/apiSync.ts`
- `src/types/index.ts`
- `supabase/migrations/20260906000000_initial_schema.sql`
- `src/data/helpCenterData.ts`

## 5. Glossário de domínio

Usar estes termos consistentemente no código, nos testes e na ajuda:

- **Série**: vínculo estável entre lançamentos relacionados.
- **Série parcelada de cartão**: compra com número total finito de parcelas.
- **Série de despesa fixa**: regra recorrente semanal, mensal ou anual, com término opcional.
- **Ocorrência**: transação real e individual pertencente a uma série.
- **Parcela histórica**: posição anterior à adoção do Finly; participa apenas do progresso sintetizado e não existe como transação financeira.
- **Primeira parcela controlada**: primeira parcela real criada no Finly; em `05/12`, é a 05.
- **Exceção**: ocorrência cujo valor foi alterado apenas para aquele período.
- **Impacto analítico**: participação em orçamento, relatórios e indicadores pessoais.
- **Impacto financeiro real**: movimento em conta ou obrigação no cartão.
- **Fatura de destino**: fatura autoritativa da primeira parcela controlada.
- **Lembrete individual**: alerta opt-in de uma despesa comum; não se aplica a compra de cartão.

## 6. Decisão arquitetural

### 6.1 Criar uma entidade de série explícita

Não duplicar configuração de recorrência em todas as transações e não representar parcelas históricas como transações ignoradas. Criar uma coleção/tabela `transaction_series` e ligar apenas ocorrências reais por `seriesId`.

Razões:

- satisfaz literalmente “não lançar nos meses anteriores”;
- separa progresso histórico de dados financeiros;
- viabiliza séries fixas com regras e exceções;
- remove o agrupamento frágil por descrição;
- permite operações por escopo e reconciliação idempotente;
- mantém uma interface pequena para os chamadores.

Durante a implementação, registrar a decisão em `docs/decisions/ADR-004-transaction-series-and-financial-impact.md`, seguindo a convenção dos ADRs existentes. O ADR deve explicar por que foram rejeitadas:

- a criação de parcelas históricas com `ignored: true`;
- a duplicação do template em cada transação;
- a detecção permanente por descrição/cartão;
- uma única flag para representar histórico, terceiro e exclusão manual.

### 6.2 Modelo TypeScript proposto

Em `src/types/index.ts`, introduzir uma união discriminada, sem `any` e sem enum:

```ts
export type TransactionSeriesKind = 'card_installment' | 'recurring_expense';
export type SupportedRecurrenceFrequency = 'weekly' | 'monthly' | 'yearly';
export type AnalyticsExclusionReason = 'manual' | 'third_party' | 'reimbursement';

export interface TransactionSeriesBase {
  id: string;
  kind: TransactionSeriesKind;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardInstallmentSeries extends TransactionSeriesBase {
  kind: 'card_installment';
  cardId: string;
  purchaseDate: string;
  firstInvoiceMonth: string;
  totalAmount: number;
  totalInstallments: number;
  firstTrackedInstallment: number;
  amountInputMode: 'total' | 'per_installment';
}

export interface RecurringExpenseSeries extends TransactionSeriesBase {
  kind: 'recurring_expense';
  accountId: string;
  frequency: SupportedRecurrenceFrequency;
  defaultAmount: number;
  amountRules: Array<{
    effectiveFrom: string;
    amount: number;
  }>;
}

export type TransactionSeries =
  | CardInstallmentSeries
  | RecurringExpenseSeries;
```

Estender `Transaction` com campos explícitos:

```ts
seriesId?: string;
seriesSequence?: number;
occurrenceKey?: string;
isSeriesException?: boolean;
analyticsExclusionReason?: AnalyticsExclusionReason;
```

Compatibilidade:

- para novas parcelas, preencher também `installments.parentId = seriesId`;
- manter `ignored` durante a migração e serialização, mas concentrar sua interpretação nos seletores de impacto;
- não criar `financialImpact: historical` em transações, pois histórico ficará na série e na timeline sintetizada;
- não alterar os metadados de dívida (`debtId`, `debtInstallmentNumber`, `debtBreakdown`).

### 6.3 Persistência Supabase proposta

Criar uma migration pelo workflow vigente do projeto, sem editar migrations já aplicadas.

Tabela `public.transaction_series`:

- `id TEXT PRIMARY KEY`;
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`;
- `kind TEXT NOT NULL CHECK (...)`;
- campos comuns de descrição, categoria, subcategoria, datas e timestamps;
- campos de cartão: `card_id`, `purchase_date`, `first_invoice_month`, `total_amount`, `total_installments`, `first_tracked_installment`, `amount_input_mode`;
- campos de recorrência: `account_id`, `frequency`, `default_amount`, `amount_rules JSONB`;
- constraints por `kind` para impedir combinações inválidas;
- trigger `updated_at` conforme padrão atual;
- RLS habilitado e políticas de select/insert/update/delete por `user_id = auth.uid()`;
- grants somente conforme o padrão já existente para `authenticated`; nunca usar chave privilegiada no cliente.

Adicionar a `public.transactions`:

- `series_id TEXT NULL REFERENCES public.transaction_series(id) ON DELETE SET NULL`;
- `series_sequence INTEGER NULL CHECK (series_sequence > 0)`;
- `occurrence_key TEXT NULL`;
- `is_series_exception BOOLEAN NOT NULL DEFAULT false`;
- `analytics_exclusion_reason TEXT NULL CHECK (...)`.

Índices:

- `(user_id, series_id, series_sequence)`;
- índice único parcial `(user_id, series_id, occurrence_key) WHERE series_id IS NOT NULL AND occurrence_key IS NOT NULL`;
- `(user_id, card_id, invoice_month)` se ainda não existir e após confirmar com `EXPLAIN`/advisors que os caminhos usam esse filtro.

Antes da migration, o agente executor deve:

1. identificar se o projeto usa migrations imperativas ou schema declarativo;
2. consultar changelog e documentação Supabase atuais;
3. gerar a migration com o CLI, em vez de inventar o timestamp/nome;
4. revisar RLS e executar advisors disponíveis;
5. testar leitura e gravação com dois usuários para impedir acesso cruzado.

### 6.4 Impacto financeiro e analítico

Criar `src/utils/transactionImpact.ts` como módulo profundo. Todos os chamadores devem usar seletores centrais, em vez de repetir filtros.

Interface mínima sugerida:

```ts
isIncludedInPersonalAnalytics(transaction): boolean
isIncludedInAccountBalance(transaction): boolean
isIncludedInCardInvoice(transaction): boolean
isIncludedInCardLimit(transaction): boolean
```

Matriz obrigatória:

| Caso | Conta/saldo | Fatura | Limite | Orçamento/relatórios | Progresso |
|---|---:|---:|---:|---:|---:|
| Despesa comum normal paga | Sim | N/A | N/A | Sim | N/A |
| Despesa comum ignorada paga | Sim | N/A | N/A | Não | N/A |
| Compra de cartão normal | Via pagamento da fatura | Sim | Sim | Sim | Sim |
| Compra de terceiro/manualmente ignorada no cartão | Via pagamento da fatura | Sim | Sim | Não | Sim |
| Parcela histórica | Não | Não | Não | Não | Sim, sintetizado |
| Receita de reembolso | Sim | N/A | N/A | Não | N/A |
| Transferência concluída | Origem e destino | N/A | N/A | Neutra | N/A |
| Transferência agendada | Não, até confirmar | N/A | N/A | Neutra | N/A |

Aplicar esses seletores, no mínimo, em:

- Dashboard e métricas consolidadas;
- Orçamento e cards auxiliares;
- Relatórios e exportações;
- Fluxo de caixa;
- Extrato;
- Faturas e limite;
- motor de notificações;
- totais da tela de detalhes.

### 6.5 Fonte única para competência de fatura

Criar ou aprofundar a interface de `src/utils/invoiceCalculator.ts` para que `invoiceMonth` seja a fonte persistida/autoritativa e `dueDate` seja derivada/validada de maneira consistente.

Interface esperada:

```ts
resolveTransactionInvoicePeriod({ transaction, card }): {
  invoiceMonth: string;
  dueDate: string;
}
```

Para nova série importada:

- `firstInvoiceMonth` corresponde à parcela `firstTrackedInstallment`;
- parcelas seguintes avançam por mês a partir dessa fatura;
- `purchaseDate` não pode deslocar a fatura escolhida pelo usuário;
- histórico é reconstruído para exibição retrocedendo meses, sem criar transações;
- cálculos mensais devem usar helpers que preservem o último dia válido do mês.

Substituir cálculos paralelos em `CreditTab`, `PayInvoiceModal`, pagamento/reabertura de fatura, notificações e exportações.

## 7. Módulos e seams de teste

Criar módulos puros antes de alterar o formulário:

### 7.1 `src/utils/cardInstallmentSeries.ts`

Interface sugerida:

```ts
buildCardInstallmentSeries(input): {
  series: CardInstallmentSeries;
  transactions: Transaction[];
  preview: CardInstallmentPreview;
}

buildCardInstallmentTimeline({ series, transactions }): InstallmentTimelineItem[]
```

Invariantes:

- `firstTrackedInstallment` fica entre 1 e `totalInstallments`;
- `05/12` cria somente oito transações reais, numeradas 5–12;
- timeline sintetiza 1–4 como `historical_paid`;
- os valores de todas as 12 posições somam exatamente o total;
- IDs/occurrence keys são estáveis por série + sequência;
- todos os lançamentos reais recebem `seriesId` e `installments.parentId`;
- a fatura da parcela 5 é exatamente a escolhida;
- não usar descrição para identidade.

### 7.2 `src/utils/recurringExpenseSeries.ts`

Interface sugerida:

```ts
reconcileRecurringSeries({ series, transactions, throughDate, today }): {
  toCreate: Transaction[];
  toUpdate: Transaction[];
}

applyRecurringAmountChange({
  series,
  transactions,
  selectedOccurrence,
  scope,
  amount,
  overwriteExceptions,
}): SeriesMutation
```

Invariantes:

- horizonte de 12 meses e data final respeitados;
- semanal preserva o dia da semana;
- mensal preserva o dia quando válido e usa o último dia nos meses menores;
- anual trata 29 de fevereiro de forma determinística;
- reconciliação repetida não duplica ocorrências;
- ocorrência futura é `scheduled`;
- ocorrência vencida/atual não paga é `pending`;
- nenhuma transição automática marca `completed`;
- `single` cria/mantém `isSeriesException = true`;
- `current_and_future` adiciona uma regra efetiva e atualiza somente ocorrências não excepcionais;
- exceções só são sobrescritas após confirmação explícita.

### 7.3 `src/utils/transactionSeriesScope.ts`

Interface sugerida:

```ts
selectSeriesTargets({
  series,
  transactions,
  selectedTransactionId,
  scope,
}): SeriesTargetSelection
```

Escopos:

- `single`;
- `current_and_future`;
- `entire_series`.

O retorno deve incluir IDs, quantidades por status, valor total afetado e se há itens pagos/históricos. A UI usa esse mesmo retorno para a confirmação e a mutação, evitando divergência entre a prévia e o que será apagado.

### 7.4 Mutação única no contexto

Adicionar ao `FinancialContext` uma interface única, por exemplo:

```ts
applyTransactionSeriesMutation(mutation: SeriesMutation): Promise<SeriesMutationResult>
```

Ela deve:

1. validar a mutação;
2. atualizar séries e transações localmente em uma operação lógica;
3. registrar a mutação no journal antes de iniciar persistência;
4. executar upserts/deletes explícitos no adapter;
5. impedir que um pull iniciado antes sobrescreva o resultado;
6. manter tombstones para deletes até confirmação remota;
7. exibir erro e ação de tentar novamente; não engolir falhas;
8. ser idempotente no replay após reload/offline.

Não adicionar um segundo estado global só para séries. Integrar a coleção no mesmo modelo de dados e ciclo de sync já usado pelo `FinancialContext`.

## 8. Especificação das telas

### 8.1 Receita

Ordem obrigatória:

1. Valor;
2. Situação;
3. Data;
4. Descrição;
5. Categoria;
6. Subcategoria;
7. Conta bancária;
8. Mais detalhes.

“Mais detalhes” mantém somente opções aplicáveis, na ordem relativa definida pelo usuário: Anexo, Tags, Observações e Ignorar no orçamento quando aplicável. Não mostrar compra de terceiro, despesa fixa nem lembrete de pagamento em receita.

### 8.2 Despesa comum

Ordem obrigatória:

1. Valor;
2. Situação;
3. Data;
4. Descrição;
5. Categoria;
6. Subcategoria;
7. Conta bancária;
8. Mais detalhes.

Dentro de “Mais detalhes”:

1. Anexo;
2. Tags;
3. Observações;
4. Despesa fixa;
5. Ignorar no orçamento;
6. Lembrete.

Quando “Despesa fixa” for ativada, mostrar frequência, início e término opcional. Não oferecer diária.

Separar semanticamente:

- `Data`: competência/lançamento;
- `Vencimento`: obrigatório quando situação for pendente ou lembrete for ativado.

O lembrete usa vencimento, antecedência e horário. Salvar nunca dispara o aviso de vencimento de forma síncrona.

### 8.3 Despesa de cartão

Ordem obrigatória:

1. Valor;
2. Data;
3. Descrição;
4. Categoria;
5. Subcategoria;
6. Cartão de crédito;
7. Parcelas;
8. Fatura de Destino;
9. Mais detalhes.

Bloco “Parcelas”:

- escolha “À vista” ou “Parcelada”;
- modo de valor: “Valor total” ou “Valor de cada parcela”;
- quantidade total entre os limites já suportados pelo produto;
- pergunta “Esta compra já está em andamento?”;
- se sim, solicitar “Parcela atual aberta”, com exemplo `05 de 12`;
- inferir e mostrar `4 parcelas pagas antes do Finly`;
- validar que a atual está entre 1 e o total;
- prévia com primeira parcela controlada, última parcela, total, valores e faturas;
- Fatura de Destino governa a parcela atual aberta.

Não mostrar status Pago/Pendente, despesa fixa nem lembrete individual para cartão.

Dentro de “Mais detalhes”:

1. Anexo;
2. Tags;
3. Observações;
4. Compra de terceiro;
5. Ignorar no orçamento.

Ativar “Compra de terceiro” continua ativando a exclusão analítica, mas não remove a compra da fatura/limite.

### 8.4 Detalhes da compra parcelada

Exibir:

- descrição e valor total;
- `12x`, valor das parcelas e eventual ajuste da última;
- `4 pagas antes do Finly`;
- parcela atual `05/12`;
- quantidade e valor restante;
- barra de progresso;
- timeline sintetizada com estados `Paga antes do Finly`, `Aberta`, `Futura` e `Paga`;
- término previsto;
- badge de terceiro/reembolso quando aplicável.

A timeline deve consultar `seriesId`; fallback por descrição serve apenas para visualização legada e nunca habilita exclusão coletiva.

### 8.5 Exclusão

Ao excluir uma ocorrência ligada a série, abrir sheet/modal com:

- Somente esta;
- Esta e as futuras;
- Série inteira.

Antes de confirmar, mostrar o resultado de `selectSeriesTargets`: quantidade, pagas, abertas, futuras, valor e histórico sintetizado afetado.

Para “Série inteira” com itens pagos/históricos:

- usar título e ação destrutiva explícitos;
- exigir segunda confirmação;
- manter a ação de desfazer já existente, estendida à série;
- persistir delete remoto explicitamente para impedir ressurreição.

Para série legada sem ID seguro, exibir apenas “Somente esta”. Não sugerir agrupamento automático.

### 8.6 Edição de despesa fixa

Ao alterar valor:

- “Somente esta”: marca ocorrência como exceção;
- “Esta e as futuras”: cria regra a partir da data escolhida e preserva exceções;
- se houver exceções futuras, mostrar quantas serão preservadas e oferecer uma ação separada para sobrescrevê-las.

Ao excluir, usar os três escopos gerais. “Esta e futuras” encerra/ajusta a série e remove apenas ocorrências ainda abrangidas; “Série inteira” remove o template e todas as ocorrências após confirmação reforçada.

### 8.7 Transferência unificada

Usar o mesmo formulário e a mesma mutação tanto no atalho global quanto em Contas.

Campos:

1. Valor;
2. Conta de origem;
3. Conta de destino;
4. Data;
5. Descrição opcional;
6. Mais detalhes: Anexo, Tags, Observações.

Regras:

- exigir pelo menos duas contas;
- impedir origem igual ao destino com mensagem junto ao campo;
- eliminar categoria manual, cartão, terceiro, ignorar, lembrete, fixa e parcelamento;
- usar uma única categoria canônica de transferência;
- transferência de hoje/concluída debita origem e credita destino exatamente uma vez;
- transferência futura fica `scheduled` e não altera saldos;
- confirmação posterior aplica os dois lados;
- saldo insuficiente gera aviso, mas permite continuar;
- edição/exclusão de concluída reverte e reaplica os dois saldos corretamente;
- filtros por conta incluem tanto origem quanto destino;
- pagamento de fatura continua fora deste formulário.

### 8.8 Reembolso de terceiro

Evoluir o fluxo existente `reimburseThirdPartyTransaction`:

- abrir modal com valor recebido, data e conta de destino;
- valor padrão é o saldo ainda não reembolsado;
- permitir múltiplos recebimentos parciais;
- criar receita concluída ligada à compra ou série;
- a receita altera o saldo da conta, mas usa `analyticsExclusionReason = 'reimbursement'`;
- somar os recebimentos vinculados para determinar `Parcialmente reembolsado` ou `Reembolsado`;
- não depender apenas de um booleano sem vínculo;
- impedir duplo clique/replay de criar receita duplicada;
- definir comportamento explícito ao excluir compra ou receita vinculada; nunca apagar o outro lado silenciosamente.

## 9. Notificações

Refatorar `src/utils/notificationEngine.ts` para separar seleção de candidatos, cálculo de data e entrega da notificação.

### Regras obrigatórias

1. Compras com `cardId` nunca entram no bloco de contas pendentes.
2. Faturas usam `invoiceMonth` + `dueDate`, não `transaction.date`.
3. Despesa comum exige `reminder.enabled === true`.
4. Usar `dueDate` como vencimento.
5. `daysBefore = 0` é válido; substituir fallback baseado em `||` por validação/nullish coalescing.
6. Usar uma única estratégia de data local; não misturar UTC e dia local.
7. Respeitar `reminderTime` individual, com preferência global apenas como default/master switch.
8. Salvar/editar uma transação não dispara notificação imediatamente, inclusive quando vence hoje.
9. Avaliação acontece em boot/resume e no scheduler suportado, mas precisa distinguir execução causada por mutação.
10. Deduplicar por tipo + entidade + vencimento + antecedência.
11. Editar/desativar lembrete cancela ou invalida agendamento antigo.
12. Parcela histórica não entra em alertas. Uma despesa comum manualmente ignorada ainda pode alertar se o usuário ativar seu lembrete; terceiro no cartão continua coberto apenas pela fatura.

Criar funções puras com `now` e timezone injetáveis para testes. A entrega deve documentar a limitação real do Web/PWA: notificações com o app totalmente fechado dependem do suporte do navegador/service worker; o Android pode usar o agendamento nativo do Capacitor.

## 10. Migração e compatibilidade

### 10.1 Cartão

- Novas compras parceladas sempre recebem série.
- Compras antigas com `installments.parentId` válido podem ser vinculadas a uma série por migração determinística, desde que o ID identifique inequivocamente o grupo.
- Compras antigas sem `parentId` não serão agrupadas por descrição/cartão.
- Para essas compras, preservar visualização atual e permitir somente ação unitária.
- Não executar backfill heurístico silencioso.

### 10.2 Despesas fixas

Migration/reconciliador idempotente:

1. localizar despesas `recurring = true` ainda sem `seriesId`;
2. criar ID determinístico a partir do ID original;
3. preservar a transação como primeira ocorrência, com seu status e valor;
4. criar regra padrão a partir dessa ocorrência;
5. gerar somente ocorrências posteriores necessárias ao horizonte de 12 meses;
6. nunca criar meses anteriores;
7. usar unique key de ocorrência para evitar duplicação em reexecução;
8. para legado diário, não gerar centenas de itens: manter a transação intacta, marcar necessidade de revisão e solicitar ao usuário uma frequência suportada;
9. registrar contagens de migradas, ignoradas e com necessidade de revisão, sem incluir dados financeiros nos logs.

### 10.3 `ignored` e terceiros

Backfill:

- `is_third_party = true` → `analytics_exclusion_reason = 'third_party'`;
- `ignored = true` e não terceiro → `analytics_exclusion_reason = 'manual'`;
- manter o booleano para compatibilidade durante uma versão de transição;
- leitores aceitam os dois formatos; escritores novos persistem ambos coerentemente;
- remoção futura do booleano fica fora desta entrega.

## 11. Persistência e sincronização

Atualizar:

- tipos de store/app data;
- carga e save de `transaction_series` em `src/services/supabaseDb.ts`;
- adaptadores de `src/utils/apiSync.ts`/servidor, se a rota de sync exigir whitelist;
- `FinancialContext` e inicialização;
- demo data e import/export quando necessário;
- serialização/readback dos novos campos de transação.

Requisitos de consistência:

- criação de série e ocorrências é uma mutação lógica única;
- IDs são gerados antes da persistência e permanecem iguais em retry;
- deletes produzem tombstones até confirmação remota;
- pull iniciado antes da mutação não pode substituí-la;
- POSTs são serializados/coalescidos por usuário;
- falha remota não é tratada como sucesso;
- reload depois de sucesso remoto reproduz exatamente série, regras, exceções e vínculos;
- excluir todas as transações continua executando delete remoto, mesmo quando o array local fica vazio.

## 12. Estratégia TDD

Trabalhar em fatias verticais: teste vermelho → implementação mínima → próximo teste. Testar interfaces públicas dos módulos, não detalhes internos.

### 12.1 Novos scripts

Adicionar scripts claros ao `package.json`, por exemplo:

- `test:card-series`;
- `test:recurring-series`;
- `test:transaction-impact`;
- `test:notifications`;
- `test:transfers`;
- `test:transaction-sync-race`;
- agregador `test:all-transactions`.

Manter `test:all-debts` intacto e executá-lo como regressão obrigatória.

### 12.2 Casos de cartão

- `05/12` cria 8 transações reais e 4 itens históricos virtuais;
- progresso inicial é 4/12, não 5/12;
- parcela 05 está aberta;
- modo valor total e modo valor por parcela;
- `R$ 100 / 3` fecha exatamente R$ 100;
- meses com dias 29, 30 e 31;
- fevereiro bissexto e não bissexto;
- virada de dezembro para janeiro;
- Fatura de Destino prevalece sobre inferência da data original;
- parent/series ID não depende da descrição;
- duas compras “Amazon” no mesmo cartão não se misturam;
- histórico não aparece no extrato nem em fatura/limite/orçamento;
- terceiro/ignorado aparece em fatura/limite, mas não em analytics;
- edição altera somente a parcela selecionada;
- exclusões pelos três escopos;
- legado sem ID só admite exclusão unitária.

### 12.3 Casos de despesas fixas

- semanal, mensal e anual;
- término opcional;
- horizonte exato de 12 meses;
- reconciliação repetida não duplica;
- status scheduled/pending/completed;
- saldo só muda em completed;
- último dia de meses menores;
- 29 de fevereiro;
- editar somente esta cria exceção;
- editar esta e futuras cria regra efetiva;
- exceção futura é preservada;
- sobrescrita só ocorre quando autorizada;
- exclusão pelos três escopos;
- migração legada idempotente e sem passado;
- legado diário fica para revisão.

### 12.4 Casos de notificação

- compra no cartão criada hoje não gera alerta de conta;
- fatura gera no máximo um alerta consolidado;
- despesa sem reminder nunca alerta;
- despesa com reminder usa dueDate;
- despesa comum ignorada com reminder explícito ainda pode alertar;
- salvar despesa vencendo hoje não alerta imediatamente;
- scheduler pode alertar no ciclo posterior elegível;
- `daysBefore = 0` permanece zero;
- antecedências 1, 2 e 7;
- horário individual e global;
- timezone `America/Fortaleza` perto da meia-noite;
- virada de mês/ano;
- dedupe entre boot, resume e re-render;
- editar/desativar lembrete invalida o anterior.

### 12.5 Casos de transferência

- origem diferente do destino;
- bloqueio quando há menos de duas contas;
- aviso de saldo insuficiente sem bloqueio;
- concluída debita/credita uma vez;
- agendada não muda saldo;
- confirmação futura aplica uma vez;
- editar/excluir reverte corretamente;
- filtro encontra pela origem e pelo destino;
- os dois pontos de entrada produzem o mesmo modelo/categoria.

### 12.6 Casos de reembolso

- conta/data/valor escolhidos;
- receita ligada e excluída de analytics;
- parcial mantém “parcialmente reembolsado”;
- soma integral marca “reembolsado”;
- retry/duplo clique não duplica receita;
- exclusão de um lado não remove o outro silenciosamente.

### 12.7 Casos de sincronização

- GET iniciado antes de add/edit/delete e resolvido depois;
- POSTs fora de ordem;
- delete parcial e retry;
- reload não ressuscita série/ocorrência;
- replay offline é idempotente;
- exceção e regras sobrevivem ao readback;
- isolamento entre usuários e RLS.

## 13. Fases de implementação

### Fase 0 — Preflight

1. Ler `AGENTS.md`, ADR-001, ADR-002 e estado atual do repositório.
2. Executar `git status --short` e preservar alterações preexistentes.
3. Confirmar versão atual, branch `main`, remoto e scripts disponíveis.
4. Consultar documentação/changelog atual do Supabase antes de decidir o workflow da migration.
5. Não iniciar release até todas as validações passarem.

### Fase 1 — Testes e interfaces de domínio

1. Criar os testes vermelhos das interfaces públicas.
2. Adicionar tipos de série e impacto.
3. Implementar `cardInstallmentSeries`, `recurringExpenseSeries`, `transactionSeriesScope`, `transactionImpact` e o resolvedor único de fatura.
4. Fechar cada fatia antes de alterar a UI.

### Fase 2 — Schema e adapters

1. Criar migration nova.
2. Adicionar RLS, constraints e índices.
3. Atualizar `supabaseDb`, modelo de store, sync REST/local e readback.
4. Implementar journal/tombstones para transações/séries.
5. Validar isolamento e persistência antes de ligar a UI.

### Fase 3 — Parcelamento de cartão

1. Refatorar criação no `TransactionModal` para usar o builder puro.
2. Implementar os dois modos de valor.
3. Implementar parcela atual aberta e Fatura de Destino autoritativa.
4. Criar somente parcelas reais da atual em diante.
5. Atualizar detalhe/timeline/progresso.
6. Remover identidade por descrição de ações destrutivas.
7. Aplicar seleção de impacto em fatura, limite, orçamento e relatórios.

### Fase 4 — Exclusão por escopo

1. Criar modal/sheet reutilizável.
2. Ligar Extrato, detalhe e Cartões ao mesmo fluxo.
3. Adicionar dupla confirmação para série inteira com histórico/pagas.
4. Estender undo e persistência remota.
5. Manter operações legadas restritas ao item atual.

### Fase 5 — Despesas fixas

1. Implementar template + regras efetivas + ocorrências.
2. Reconciliar 12 meses de forma idempotente.
3. Adicionar edição por escopo e preservação de exceções.
4. Adicionar exclusão por escopo.
5. Migrar flags legadas.
6. Integrar Extrato, Calendário, orçamento e saldo.

### Fase 6 — Formulários e transferências

1. Reordenar os campos exatamente como especificado.
2. Aplicar divulgação progressiva em “Mais detalhes”.
3. Garantir alvos de toque de pelo menos 44×44 px, rótulos visíveis, foco e feedback próximo do campo.
4. Unificar os dois fluxos de transferência.
5. Implementar agendamento/confirmar e reversão correta.

### Fase 7 — Notificações

1. Extrair regras puras.
2. Excluir cartão do bloco de contas.
3. Exigir reminder em despesa comum.
4. Corrigir vencimento, zero dias, horário, timezone e dedupe.
5. Remover o disparo provocado diretamente por mutação.
6. Validar Android e limitações reais da Web/PWA.

### Fase 8 — Reembolso

1. Evoluir modal e vínculo.
2. Suportar parciais.
3. Excluir receita de analytics, mantendo saldo.
4. Garantir idempotência e tratamento de exclusão.

### Fase 9 — Documentação e Helpdesk

1. Criar ADR-004.
2. Atualizar `docs/FEATURES_AND_BUSINESS_RULES.md` e `docs/ARCHITECTURE.md`.
3. Atualizar em `src/data/helpCenterData.ts`:
   - “Como lançar uma despesa”;
   - cartões e faturas;
   - mobile/atalhos/notificações;
   - FAQs de conta versus cartão e pagamento de fatura;
   - criar/corrigir o FAQ de parcelamento inexistente.
4. Explicar `05/12`, histórico sem impacto, exclusão por escopo, variação de fixa, lembrete opt-in e transferência agendada.
5. Atualizar os callouts Web e Android em 3–5 passos por tarefa.
6. Corrigir referências antigas de cores, abas e limite de parcelas.
7. Atualizar `FinlyAndroidMockup.tsx` se ele continuar representando o fluxo alterado.

### Fase 10 — Validação funcional e visual

1. Rodar todas as suítes novas.
2. Rodar regressões de dívidas.
3. Checar tipos e build.
4. Subir ambiente local e validar em desktop e viewport Android.
5. Testar reload, offline/reconexão e corrida de sync.
6. Não usar a conta real para dados destrutivos; preferir demo/fixture e limpar qualquer resíduo de teste.

### Fase 11 — Versão, commit, APK e deploy

Executar somente depois de todas as fases anteriores aprovadas. O Q29 autoriza este ciclo na futura sessão de execução.

1. Reconsultar a versão vigente; não assumir `1.1.60` se o repositório tiver avançado.
2. Incrementar o patch e sincronizar:
   - `package.json`;
   - `package-lock.json`;
   - `src/data/releases.ts`;
   - `README.md`;
   - `CHANGELOG.md`;
   - `src/data/helpCenterData.ts` quando houver referência de versão.
3. Executar, nesta ordem:

```powershell
npm.cmd run check:version
npm.cmd run test:all-transactions
npm.cmd run test:all-debts
npx.cmd tsc --noEmit
npm.cmd run build
npm.cmd run cap:sync
```

4. Revisar `git status`, `git diff --stat` e o diff pertinente. Não incluir alterações preexistentes não relacionadas.
5. Criar commit semântico, por exemplo `feat: aprimora séries de transações e lançamentos vX.X.XX`.
6. Fazer `git push origin main`.
7. Aguardar `.github/workflows/build-apk.yml` concluir com `success`.
8. Confirmar o APK na Release `vX.X.XX`. Não compilar APK localmente.
9. Só então executar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vps.ps1
```

10. Validar HTTP 200, frontend e API:
    - `/app-version.json`;
    - `/api/app/version`;
    - versão do bundle e download do APK.
11. Fazer smoke test de produção sem deixar dados de teste.

## 14. Critérios de aceite finais

### Cartão

- [ ] Compra `05/12` mostra quatro históricas e cria somente 05–12.
- [ ] Nenhum mês anterior recebe transação financeira.
- [ ] Histórico não altera nenhuma métrica/fatura/limite.
- [ ] Fatura de Destino contém a parcela 05.
- [ ] Soma das parcelas é exata.
- [ ] Série usa ID estável.
- [ ] Duas compras homônimas não se misturam.
- [ ] Edição permanece unitária.
- [ ] Exclusão oferece três escopos nas séries novas.

### Despesa fixa

- [ ] Semanal, mensal e anual funcionam.
- [ ] Data final opcional funciona.
- [ ] Existem 12 meses de horizonte sem duplicidade.
- [ ] Futuras são agendadas e não alteram saldo.
- [ ] Edição mensal não altera passado.
- [ ] Exceções são preservadas.
- [ ] Legado é migrado sem passado/duplicidade.

### Formulários

- [ ] Ordem dos campos coincide exatamente com a seção 8.
- [ ] Anexo é o primeiro item de “Mais detalhes”.
- [ ] Parcelas aparecem logo após o cartão e antes da fatura.
- [ ] Cartão não mostra lembrete.
- [ ] Campos condicionais não deixam valores ocultos residuais ao trocar o tipo.
- [ ] Web e Android mantêm acessibilidade, safe area e alvos de toque.

### Notificações

- [ ] Criar cartão não gera “vence hoje”.
- [ ] Criar despesa que vence hoje também não notifica de modo imediato.
- [ ] Despesa sem reminder nunca gera alerta individual.
- [ ] Fatura continua alertando de forma consolidada.
- [ ] “No vencimento” salva e executa com zero dias.
- [ ] Não há duplicidade em boot/resume/re-render.

### Transferências e reembolso

- [ ] Ambos os pontos de entrada usam o mesmo formulário.
- [ ] Origem igual ao destino é impedida com feedback.
- [ ] Futura não altera saldo até confirmar.
- [ ] Saldo insuficiente apenas avisa.
- [ ] Reembolso permite conta, data, valor e parcialidade.
- [ ] Receita de reembolso altera saldo, mas não analytics.

### Sync e release

- [ ] Reload preserva séries, regras, exceções e deletes.
- [ ] Testes de GET/POST atrasados passam.
- [ ] RLS impede leitura/escrita de outro usuário.
- [ ] Helpdesk Web/Android atualizado.
- [ ] Versão sincronizada nas seis fontes.
- [ ] Testes, TypeScript, build e Capacitor sync passam.
- [ ] GitHub Actions publica APK com sucesso.
- [ ] VPS e endpoints reportam a nova versão.

## 15. Riscos e mitigação

| Risco | Mitigação obrigatória |
|---|---|
| Perda/duplicação de centavos | Calcular em centavos inteiros e testar valores não divisíveis |
| Datas 29–31 pularem mês | Helper de mês civil com clamp para último dia válido |
| Mistura de séries homônimas | ID estável; nunca usar descrição para mutação coletiva |
| Parcela histórica contaminar métricas | Não persistir como transação; sintetizar somente na timeline |
| Terceiro sumir da fatura | Separar impacto analítico de obrigação no cartão |
| Série recorrente duplicar no reload | occurrence key única + reconciliador idempotente |
| Pull antigo ressuscitar delete | journal/tombstone e testes com respostas atrasadas |
| Notificação imediata regressar | remover trigger de mutação e teste causal específico |
| Migração diária criar centenas de itens | marcar legado diário para revisão, sem autoexpansão |
| Exclusão em massa apagar histórico por engano | prévia derivada da mesma seleção + dupla confirmação + undo |
| Divergência Web/Android | teste visual dos dois fluxos e Helpdesk dual-platform |
| Migration/RLS expor dados | RLS por owner, grants mínimos, teste com dois usuários e advisors |

## 16. Rollback

- Migration deve ser aditiva: nova tabela/colunas, sem remover `ignored`, `recurring` ou `installments.parentId` nesta entrega.
- Manter leitores compatíveis com registros antigos durante a versão de transição.
- Se houver falha de UI, permitir feature flag/local gate para voltar ao fluxo unitário sem perder dados de série.
- Não apagar séries ou ocorrências durante rollback de código.
- Antes do deploy, registrar contagens anônimas de séries/ocorrências migradas para detectar divergência.
- Se o deploy falhar após a migration, restaurar o bundle anterior; a migration aditiva permanece compatível.
- Se a geração criar duplicidade, interromper reconciliador, não apagar em massa automaticamente e corrigir pela unique key/auditoria.

## 17. Skills indicadas ao agente executor

Usar, nesta ordem e somente quando aplicável:

1. `context-pruning` e `pre-action-guard` — obrigatórias para toda tarefa.
2. `tdd` — trabalhar em fatias verticais nos seams descritos na seção 7.
3. `codebase-design` — preservar módulos profundos e uma interface única de séries.
4. `domain-modeling` — manter o glossário deste plano; registrar o ADR-004.
5. `typescript` — união discriminada, sem `any`, funções puras e tipos precisos.
6. `supabase` — migration, RLS, adapters e validação com documentação atual.
7. `ui-ux-pro-max` — formulário progressivo, acessibilidade e interação mobile.
8. `finly-helpdesk` — atualizar guias e callouts Web/Android.
9. `plannerfin-deploy` apenas como referência de build; as regras de `AGENTS.md` prevalecem, e toda comunicação/marca deve continuar Finly.
10. `code-review` antes do commit para conferir aderência ao plano e aos padrões do repositório.

Não instalar as skills externas encontradas na busca para esta tarefa. Os resultados de fintech eram predominantemente voltados a Rust ou tinham baixa aderência/reputação para o stack React/TypeScript do Finly; as skills locais acima cobrem melhor o trabalho.

## 18. Instrução pronta para o agente executor

Copiar e enviar ao agente responsável:

> Execute integralmente o plano `docs/plans/2026-09-11-transacoes-cartao-despesas-fixas-transferencias.md` no projeto Finly. Trate as decisões da seção 2 como fechadas e não repita a entrevista, salvo se o código atual contradisser materialmente uma premissa. Preserve qualquer alteração preexistente. Trabalhe em TDD por fatias verticais, implemente schema/sync/UI/Helpdesk, valide todos os critérios de aceite e finalize o ciclo completo de versão, commit, push, APK via GitHub Actions e deploy na VPS. Não compile APK localmente. Pare e reporte se a mesma falha ocorrer duas vezes ou se uma migration exigir decisão destrutiva não prevista.
