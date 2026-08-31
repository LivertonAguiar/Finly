# 🏗️ Guia de Arquitetura e Estrutura Técnica - Finly

Este documento descreve o fluxo de dados, ciclo de vida de componentes e contratos de tipagem do Finly Web.

---

## 1. Fluxo de Dados e Estado Global

A aplicação utiliza o padrão **Context API + Reducers/State Hooks** para isolamento e reatividade de alta performance.

### Provedores Principais (`src/context/`):

1. **`AuthContext.tsx`**:
   - Controla a autenticação do usuário, persistência de tokens/sessão e perfil de acesso.
   - Fornece `currentUser`, `login()`, `logout()`, `updateUserProfile()`.

2. **`FinancialContext.tsx`**:
   - É o cérebro financeiro do sistema. Agrega e calcula em tempo real:
     - **Contas (`accounts`)**: Saldos atuais, projeções de saldo e transferências.
     - **Cartões (`cards`)**: Limites, fechamento de faturas e pagamentos.
     - **Transações (`transactions`)**: Receitas, despesas, transferências e conciliação.
     - **Categorias (`categories`)**: Árvore hierárquica (Categoria Pai -> Subcategorias) com ícones e cores.
     - **Planejamento / Orçamentos (`budgets`)**: Tetos de gastos globais e por categoria.
     - **Metas (`goals`)**: Aportes, prazos e progresso percentual.
     - **Dívidas (`debts`)**: Parcelamentos e amortizações.
     - **Investimentos (`investments`)**: Posição patrimonial e rentabilidade.

---

## 2. Modelos de Dados Principais (`src/types/index.ts`)

```typescript
export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'wallet' | 'other';
  institution: string;
  balance: number;
  initialBalance: number;
  color: string;
  includeInTotal: boolean;
  projected?: number;
}

export interface CreditCard {
  id: string;
  name: string;
  institution: string;
  brand: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  accountId?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string; // YYYY-MM-DD
  categoryId: string;
  subcategoryId?: string;
  accountId?: string;
  targetAccountId?: string;
  cardId?: string;
  status: 'completed' | 'pending';
  recurring?: boolean;
  installments?: {
    current: number;
    total: number;
  };
  tags?: string[];
  notes?: string;
  createdAt: string;
}
```

---

## 3. Motor de Roteamento (`App.tsx`)

O Finly utiliza o **HTML5 History API (`pushState` e `popstate`)** com mapeamento bidirecional:
- Rota para Tab: `/dashboard` -> `activeTab = 'dashboard'`
- Tab para Rota: Clicar em uma aba dispara `window.history.pushState(..., '', '/transacoes')`
- Suporte a navegação por histórico do navegador (botões Voltar/Avançar).
