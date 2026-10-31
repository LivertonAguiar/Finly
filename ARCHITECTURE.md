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

## 3. Motor de Roteamento e Navegação (`App.tsx`)

O Finly adota uma arquitetura de navegação limpa, hierárquica e de alta densidade baseada no **HTML5 History API (`pushState` e `popstate`)** com paridade entre Web e Mobile:

### 3.1. 7 Módulos Agregadores Principais
1. **`/dashboard`**: Visão executiva de saldos, indicadores e bento grid de widgets.
2. **`/transacoes`**: Extrato analítico com alternador integrado de abas (`lista` vs `calendario` via `?view=`).
3. **`/contas-cartoes`**: Módulo agregador de Contas Bancárias e Cartões de Crédito (`?tab=contas` | `?tab=cartoes`).
4. **`/planejar`**: Gestão orçamentária mensal e metas de curto/médio/longo prazo (`?tab=orcamento` | `?tab=metas`).
5. **`/patrimonio`**: Painel de Investimentos, ativos e Dívidas/Financiamentos (`?tab=investimentos` | `?tab=dividas`).
6. **`/relatorios`**: Relatórios gerenciais, gráficos de evolução e BI.
7. **`/assistente`**: Inteligência artificial: Assistente WhatsApp e Skills autônomas (`?tab=whatsapp` | `?tab=skills`).
8. **`/settings`**: Ajustes unificados com 8 subseções em abas (`?section=perfil|familia|categorias|preferencias|seguranca|dados|ajuda|sobre`).
9. **`/mais`**: Hub complementar móvel com menu curto de atalhos e aba Sobre.

### 3.2. Sub-rotas e Sincronização via Query Parameters
- Cada página agregadora gerencia sua sub-aba ativa via parâmetros de URL (`?tab=`, `?view=` ou `?section=`).
- Ouvintes de evento `popstate` sincronizam instantaneamente a sub-aba ativa com os botões Voltar/Avançar do navegador e o botão físico/gesto de retorno do Android (`useBackButton`).

### 3.3. Redirecionamento Retrocompatível Transparente
- O mapa `TAB_TO_PATH` e o interceptador `getInitialTabFromPath()` capturam links legados (`/contas`, `/cartoes`, `/planejamento`, `/metas`, `/investimentos`, `/dividas`, `/whatsapp`, `/skills`, `/calendario`, `/cadastro`, `/familia`, `/perfil`, `/ajuda`, `/sobre`) e executam `replaceState` transparente para as novas URLs com parâmetros preservando favoritos e histórico.
