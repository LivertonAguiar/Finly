# 💎 Finly — Regras de Negócio e Funcionalidades

O Finly foi arquitetado com base nas melhores práticas de experiência do usuário e excelência contábil do mercado financeiro, adaptado para máxima produtividade.

---

## 1. Motor de Cartão de Crédito e Faturas

### 🗓️ Alocação Inteligente por Data de Fechamento e Vencimento
Cada cartão de crédito possui:
* `closingDay` (Dia do fechamento da fatura)
* `dueDay` (Dia do vencimento da fatura)
* `limit` (Limite total contratado)

**Regra de Alocação de Fatura**:
* Se a compra for feita **antes do dia do fechamento**, ela entra na **fatura do mês corrente**.
* Se a compra for feita **no dia ou após o fechamento** (melhor dia de compra), ela é alocada para a **fatura do mês seguinte**.

### 📊 Regime de Caixa vs Regime de Competência
O usuário pode alternar a visualização das transações entre:
1. **Regime de Caixa (Data do Vencimento)**: As despesas de cartão aparecem agrupadas no dia em que o dinheiro realmente sai da conta bancária (dia do vencimento da fatura).
2. **Regime de Competência (Data da Compra)**: As despesas aparecem no exato dia em que o cartão foi passado na maquininha.

### 💳 Cálculo Dinâmico do Limite Disponível
O limite disponível é calculado como:
$$\text{Limite Disponível} = \text{Limite Total} - (\text{Fatura Aberta/Atual} + \text{Parcelas Futuras})$$
* **Faturas Pagas**: Restauram o limite do valor liquidado.
* **Alerta de Estouro**: Se as parcelas futuras superarem o limite, é exibido o aviso visual **⚠️ Limite ultrapassado (+R$ X,XX)**.

### 🔢 Compras Parceladas em Andamento e Rateio Exato
* **Parcela Atual Aberta (ex: 05 de 12)**:
  * Cria lançamentos financeiros reais exclusivamente da parcela informada em diante (05 a 12).
  * Parcela 01 a 04 são sintetizadas como **Pagas antes do Finly** apenas na linha do tempo da compra, sem gerar lançamentos contábeis passados nem poluir saldos, relatórios ou faturas.
* **Fatura de Destino Autoritativa**: O mês da fatura selecionado governa a competência da primeira parcela controlada.
* **Rateio Exato de Centavos**: A soma de todas as parcelas fecha rigorosamente no total da compra; qualquer centavo residual da divisão é absorvido pela última parcela.

---

## 2. Compras de Terceiros e Reembolsos Parciais

* **Compra no Cartão Emprestado**: Quando o usuário passa uma despesa para um amigo ou familiar no seu cartão:
  * A compra é incluída na fatura do cartão (para conciliação bancária precisa e consumo de limite real).
  * O switch **👤 Compra de Terceiro** é marcado com o **Nome da Pessoa**.
  * Automaticamente ativa `analyticsExclusionReason = 'third_party'` (excluindo de orçamentos e relatórios analíticos pessoais, mas mantendo a fatura).
* **Fluxo de Reembolso Interativo**:
  * Permite registrar recebimento parcial ou integral, informando o valor recebido, data e conta de destino.
  * Gera uma receita de reembolso vinculada (`analyticsExclusionReason = 'reimbursement'`) que atualiza o saldo bancário sem inflar a renda mensal pessoal.
  * O badge evolui de **A Reembolsar** para **Parcialmente Reembolsado** e **✅ Reembolsado**.

---

## 3. Despesas Fixas Recorrentes (Horizonte de 12 Meses)

* **Frequências Suportadas**: Semanal, Mensal e Anual, com data de término opcional.
* **Horizonte Materializado**: 12 meses mantidos de forma idempotente.
* **Edição de Valor por Escopo**:
  * **Somente este mês**: Cria uma exceção pontual para a ocorrência, mantendo intactas as parcelas passadas e futuras.
  * **Este e os próximos**: Cria uma regra efetiva a partir da data selecionada, preservando exceções futuras pré-configuradas (a menos que a sobrescrita seja explicitamente solicitada).
* **Transição de Status**: Futuras nascem como `scheduled` (não afetam saldo bancário); ao vencerem passam a `pending`; saldo só se movimenta após `completed`.

---

## 4. Transferência Unificada entre Contas

* **Formulário Enxuto**: Exige apenas Valor, Conta de Origem, Conta de Destino, Data e Descrição opcional.
* **Agendamento Futuro**: Se a data for posterior a hoje, nasce como `scheduled` sem debitar o saldo até a efetivação.
* **Aviso de Saldo**: Alerta o usuário caso o saldo seja inferior ao valor transferido, sem bloquear a operação.
* **Filtros**: Permite localizar a transferência pesquisando tanto pela conta de origem quanto pela de destino.

---

## 5. Exclusão por Escopo

Ao excluir lançamentos ligados a séries de cartão ou despesas fixas:
* **Somente esta**: Remove apenas a ocorrência selecionada.
* **Esta e as futuras**: Encerra ou ajusta a série a partir da data escolhida.
* **Série inteira**: Remove o template da série e todas as ocorrências vinculadas, exigindo confirmação reforçada quando envolver parcelas pagas ou histórico sintetizado.

---

## 6. Seção "Mais Detalhes" para Despesas e Receitas

* **📎 Anexo de Comprovantes**: Upload de recibos, notas fiscais e PDFs (primeiro campo da seção).
* **🏷️ Tags Personalizadas**: Sugestões rápidas e tags livres.
* **📝 Observações**: Campo de texto livre para anotações.
* **⏰ Lembretes Programados**: Notificações configuradas por antecedência (no vencimento = 0 dias, 1, 2 ou 7 dias antes) e horário. Despesas de cartão não exibem lembrete individual (notificadas apenas pela fatura consolidada).
* **🚫 Ignorar no Planejamento**: Exclui o lançamento das análises pessoais sem afetar o saldo da conta ou a fatura do cartão.

---

## 7. Ficha Detalhada da Transação (Modal Interativo)

Ao clicar em qualquer linha ou card de transação:
* **Fatura de Cartão**: Exibe a composição completa de itens, ranking por categoria e totalizadores.
* **Compra Parcelada**: Exibe barra de progresso (X de Y), histórico pago antes do Finly, chips com status individual de cada parcela e fatura correspondente.
* **Ações**: Alternar status (Paga/Pendente), Editar, Registrar Reembolso e Excluir por Escopo.
