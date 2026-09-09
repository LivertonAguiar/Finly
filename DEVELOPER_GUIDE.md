# 💻 Guia do Desenvolvedor & Extensões - Finly

Guia prático para estender o Finly em novos portais, adicionar integrações e conectar com bancos de dados relacionais.

---

## 1. Conectando a um Banco de Dados Relacional (PostgreSQL / Supabase / MySQL)

O sistema mantém cache local via `UserStoreData` em `FinancialContext.tsx` e sincroniza com Supabase e com o store da API. Para adicionar outra API externa:

### Passo 1: Criar o cliente de API (`src/services/api.ts`)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.seuservico.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finly_auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### Passo 2: Substituir as chamadas em `FinancialContext.tsx`
Substitua as mutações síncronas por chamadas assíncronas com sincronização em tempo real.

---

## 2. Invariantes de Persistência e Sincronização

Ao alterar o fluxo de dados, preserve estas garantias:

1. Uma leitura do Supabase só pode ser aplicada quando todas as tabelas do snapshot forem lidas sem erro. Falha parcial não equivale a coleção vazia.
2. Coleção vazia recebida por um salvamento geral não autoriza exclusão em massa. Exclusões devem usar operações explícitas ou o reset completo.
3. Mutações pendentes de cartões devem sobreviver no cache e ser reconciliadas com o remoto antes de remover a pendência.
4. Pulls iniciados antes de uma edição local não podem sobrescrever a edição, e gravações completas devem ser executadas em ordem.
5. Tema, preset, cor de destaque e raio dos cards são preferências locais do dispositivo e não devem ser alterados pelo heartbeat.

---

## 3. Adicionando Novos Widgets ao Dashboard

Para registrar um novo widget no Dashboard:

1. Adicione a chave em `DashboardCardsState`, `DEFAULT_CARDS_STATE` e `DEFAULT_CARDS_ORDER`, todos em `src/components/dashboard/OverviewTab.tsx`.
2. Implemente o renderer do card e registre-o no mapa `cardRenderers` do mesmo arquivo.
3. Mantenha o conteúdo com largura fluida e sem altura fixa desnecessária. O wrapper `DashboardMasonryItem` observa a altura real e calcula o encaixe vertical automaticamente.
4. Use o estado `cardSizes` para permitir meia largura ou largura total no Web. A grade muda para duas colunas pela largura útil do contêiner, definida em `src/index.css`, e não pela largura bruta da viewport.
5. Atualize `src/data/helpCenterData.ts` sempre que o novo card alterar a navegação, os controles ou o fluxo de personalização do dashboard.

O modo Android mantém os cards em uma coluna e oculta os controles de arrastar e redimensionar para preservar a rolagem por toque.

---

## 4. Integrando Open Finance / Bancos Automáticos (Pluggy / Belvo)

Para sincronização automática de contas via Open Finance:

1. Instale o SDK do provedor de agregação bancária (`@pluggy/react-connect`).
2. Capture o `itemId` da instituição conectada.
3. No webhook de transações, converte os dados do extrato para a interface `Transaction` do Finly.
