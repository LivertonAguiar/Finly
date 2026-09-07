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

---

## 2. Compras de Terceiros e Reembolsos

* **Compra no Cartão Emprestado**: Quando o usuário passa uma despesa para um amigo ou familiar no seu cartão:
  * A compra é incluída na fatura do cartão (para conciliação bancária precisa).
  * O switch **👤 Compra de Terceiro** é marcado com o **Nome da Pessoa**.
  * Automaticamente ativa a opção **🚫 Ignorar no planejamento e relatórios pessoais**.
* **Fluxo de Reembolso em 1-Clique**:
  * Na timeline, tabela e faturas, aparece o badge **👤 [Nome] (A Reembolsar)** com o botão **`+ Receber`**.
  * Ao clicar em **Receber**, o sistema gera uma **Receita de Reembolso** na conta bancária e altera o status da compra para **✅ Reembolsado**.

---

## 3. Seção "Mais Detalhes" para Despesas e Receitas

* **🏷️ Tags Personalizadas**: Sugestões rápidas de 1-clique (`#Aluguel`, `#Mercado`, `#Trabalho`, `#Viagem`, etc.) e tags ilimitadas.
* **📝 Observações**: Campo de texto livre para registros adicionais.
* **📎 Anexo de Comprovantes**: Upload de recibos, notas fiscais e PDFs com pré-visualização e download.
* **⏰ Lembretes Programados**: Notificações configuradas por antecedência (no dia, 1 a 7 dias antes) e horário.
* **🔄 Lançamento Fixo**: Recorrência contínua (Mensal, Semanal, Diária, Anual).
* **🔢 Repetir / Parcelar**: Repetições limitadas com escolha de cálculo (**Dividir valor total** vs **Repetir valor integral**).

---

## 4. Ficha Detalhada da Transação (Modal Interativo)

Ao clicar em qualquer linha ou card de transação:
* **Fatura de Cartão**: Exibe a **composição completa** de todos os itens daquela fatura, ranking de gastos por categoria com barras percentuais e totalizadores.
* **Compra Parcelada**: Exibe a **barra de progresso** (Parcela X de Y), valor já pago vs restante, e chips mensais de cada parcela.
* **Ações**: Alternar status (Paga/Pendente), Editar, Duplicar e Excluir.
