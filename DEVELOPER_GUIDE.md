# 💻 Guia do Desenvolvedor & Extensões - PlannerFin

Guia prático para estender o PlannerFin em novos portais, adicionar integrações e conectar com bancos de dados relacionais.

---

## 1. Conectando a um Banco de Dados Relacional (PostgreSQL / Supabase / MySQL)

Atualmente o sistema persiste os dados no `localStorage` via `UserStoreData` em `FinancialContext.tsx`. Para migrar para uma API externa:

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
  const token = localStorage.getItem('plannerfin_auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### Passo 2: Substituir as chamadas em `FinancialContext.tsx`
Substitua as mutações síncronas por chamadas assíncronas com sincronização em tempo real.

---

## 2. Adicionando Novos Widgets ao Dashboard

Para registrar um novo widget no Dashboard:

1. Crie o componente do widget em `src/components/dashboard/widgets/SeuWidget.tsx`.
2. Adicione a chave correspondente no estado `dashLeftWidgets` ou `dashRightWidgets` em `src/components/settings/SettingsPage.tsx`.
3. Renderize condicionalmente em `src/components/dashboard/DashboardPage.tsx`.

---

## 3. Integrando Open Finance / Bancos Automáticos (Pluggy / Belvo)

Para sincronização automática de contas via Open Finance:

1. Instale o SDK do provedor de agregação bancária (`@pluggy/react-connect`).
2. Capture o `itemId` da instituição conectada.
3. No webhook de transações, converte os dados do extrato para a interface `Transaction` do PlannerFin.
