# 🚀 Finly (Pro Edition) `v1.1.23`

> Plataforma completa de gestão financeira pessoal, planejamento orçamentário, controle de faturas de cartões, fluxo de caixa e inteligência analítica com paridade Web e Mobile Android.

[![Build Android APK & Release](https://github.com/LivertonAguiar/planner-financeiro/actions/workflows/build-apk.yml/badge.svg)](https://github.com/LivertonAguiar/planner-financeiro/actions/workflows/build-apk.yml)
[![Version](https://img.shields.io/badge/version-1.1.23-purple.svg)](package.json)
[![Changelog](https://img.shields.io/badge/changelog-CHANGELOG.md-blue.svg)](CHANGELOG.md)

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura de Pastas e Arquitetura](#-estrutura-de-pastas-e-arquitetura)
- [Rotas & Mapa do Aplicativo](#-rotas--mapa-do-aplicativo)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Personalização Visual & Theme Engine](#-personalização-visual--theme-engine)
- [Motor de Internacionalização (i18n)](#-motor-de-internacionalização-i18n)
- [Instalação, Execução e Build](#-instalação-execução-e-build)
- [Guia de Deploy & Produção](#-guia-de-deploy--produção)
- [Extensibilidade & Banco de Dados](#-extensibilidade--banco-de-dados)
- [Changelog e Versões](#-changelog-e-versões)

---

## 🌟 Visão Geral

O **Finly** é um sistema financeiro moderno construído para alta performance e responsividade tanto na Web quanto no aplicativo nativo Android. Ele combina controle transacional em tempo real, visualização de extratos bancários, previsão de fluxo de caixa, gestão de faturas de múltiplos cartões de crédito e assistente financeiro inteligente.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18** (TypeScript) | Interface declarativa com tipagem estrita |
| **Mobile Runtime** | **Capacitor 8** (Android) | Empacotamento nativo Android com suporte a hardware back button e safe-area |
| **Build & Bundler** | **Vite 5** | Compilação ultra-rápida e hot reload |
| **Estilização** | **Tailwind CSS + CSS Variables** | Design responsivo com motor de temas dinâmico |
| **Ícones** | **Lucide React** | Conjunto completo de ícones minimalistas |
| **Efeitos Visuais** | **Canvas Confetti** | Animações de metas e marcos financeiros |
| **Roteamento** | **HTML5 History API** | Sincronização em tempo real da URL (`/dashboard`, `/contas`, etc.) |
| **Backend API & Sync** | **Node.js / Express** | Serviço de sincronização multi-usuário e envio de relatórios |
| **Internacionalização** | **i18n Custom Engine** | Suporte a pt-BR, en-US e es-ES + multi-moedas |

---

## 📁 Estrutura de Pastas e Arquitetura

```text
mysterious-mendeleev/
├── .agents/                      # Definições de Skills e Automações
│   └── skills/
│       ├── financial-analytics/  # Análises financeiras e projeções
│       ├── i18n-locale-engine/   # Internacionalização e moedas
│       ├── ofx-parser/           # Parser de extratos bancários
│       ├── finly-deploy/    # Runbook de compilação e deploy
│       └── ui-theme-customizer/  # Presets de temas e geometrias
├── dist/                         # Build de produção otimizado
├── public/                       # Favicons, manifests e assets estáticos
├── server/                       # Backend Express Mail Service
│   └── index.js
├── src/
│   ├── components/
│   │   ├── accounts/             # Tela de Contas Bancárias (AccountsPage)
│   │   ├── auth/                 # Login e Autenticação (AuthPage)
│   │   ├── cadastros/            # Categorias, Tags, Modais de Contas e Cartões
│   │   ├── calendario/           # Calendário Mensal e Detalhes do Dia (CalendarPage)
│   │   ├── dashboard/            # Visão Geral, 15 Widgets, CreditTab, InvestmentsTab
│   │   ├── dividas/              # Gestão de Dívidas e Amortizações (DebtsPage)
│   │   ├── familia/              # Finanças da Família Multi-usuário (FamilyPage)
│   │   ├── layout/               # Sidebar, Header e BottomNav
│   │   ├── metas/                # Objetivos e Metas Financeiras (GoalsPage)
│   │   ├── more/                 # Hub de Mais Opções (MorePage)
│   │   ├── orcamento/            # Wizard de Planejamento 3 Passos (BudgetPage)
│   │   ├── perfil/               # Perfil do Usuário e Segurança (ProfilePage)
│   │   ├── relatorios/           # Gráficos Analíticos e BI (ReportsPage)
│   │   ├── settings/             # 5 Abas de Configurações (SettingsPage)
│   │   ├── transactions/         # Timeline e Filtros de Transações (TransactionsPage)
│   │   ├── ui/                   # Modal, EmojiPicker e Componentes Base
│   │   └── whatsapp/             # Assistente WhatsApp IA (WhatsAppPage)
│   ├── context/
│   │   ├── AuthContext.tsx       # Gestão de Sessão e Usuários
│   │   └── FinancialContext.tsx  # Estado Global Financeiro (CRUD e Cálculos)
│   ├── types/
│   │   └── index.ts              # Interfaces TypeScript de todo o sistema
│   ├── utils/
│   │   ├── bankLogos.tsx         # Logotipos oficiais de bancos e bandeiras
│   │   ├── defaultCategories.ts  # Categorias padrão com cores e ícones
│   │   ├── formatters.ts         # Formatação de moedas, datas e números
│   │   ├── i18n.ts               # Dicionário de tradução e idiomas
│   │   └── themeEngine.ts        # Motor de temas em tempo real
│   ├── App.tsx                   # Roteador central e provedores
│   ├── index.css                 # Configuração do Tailwind e CSS Variables
│   └── main.tsx                  # Ponto de entrada React com inicialização do tema
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🧭 Rotas & Mapa do Aplicativo

| Rota | Componente | Descrição |
| :--- | :--- | :--- |
| `/dashboard` | `DashboardPage` | Painel principal com 4 KPIs, Gráfico Donut de Despesas, Balanço Mensal e 15 widgets configuráveis. |
| `/transacoes` | `TransactionsPage` | Extrato diário com filtro rápido por popover (Todas, Despesas, Receitas, Transferências) e busca. |
| `/contas` | `AccountsPage` | Grid compacto de contas bancárias, saldos reais, saldos previstos e menu de reajuste. |
| `/cartoes` | `CreditTab` | Gestão de múltiplos cartões, limites disponíveis, faturas abertas/fechadas e pagamento. |
| `/planejamento` | `BudgetPage` | Wizard de 3 etapas (`criarNovoPlanejamento`), teto de gastos por categoria e comparativos. |
| `/relatorios` | `ReportsPage` | BI visual com Donut/Pizza interativo, filtros por período e exportação. |
| `/calendario` | `CalendarPage` | Grade mensal com lançamentos diários e painel lateral de detalhes ao clicar no dia. |
| `/settings` | `SettingsPage` | 5 abas de personalização: Preferências, Aparência, Dashboard, Alertas e Segurança. |
| `/mais` | `MorePage` | Hub de ferramentas adicionais exclusivas (sem duplicatas da sidebar). |
| `/metas` | `GoalsPage` | Objetivos financeiros com barras de progresso, aportes e comemoração com confetes. |
| `/dividas` | `DebtsPage` | Controle de parcelas, juros, credores e histórico de amortizações. |
| `/investimentos` | `InvestmentsTab` | Consolidação patrimonial por classe de ativos e rendimento mensal. |
| `/whatsapp` | `WhatsAppPage` | Integração de assistente virtual para lançamentos via chat. |
| `/familia` | `FamilyPage` | Controle financeiro compartilhado multi-usuário com permissões. |

---

## 🎨 Personalização Visual & Theme Engine

O sistema possui um motor dinâmico em `src/utils/themeEngine.ts` que manipula o DOM instantaneamente:

### 1. Presets de Temas
* **`finly-dark`**: Fundo `#1C1C1E` com cartões em `#2C2C2E` (Oficial).
* **`midnight-oled`**: Preto absoluto `#000000` com cartões `#121212`.
* **`emerald-slate`**: Azul petróleo marinho `#0F172A`.
* **`clean-light`**: Branco minimalista `#F8FAFC`.

### 2. Paleta de Cores de Acento (`--primary-accent`)
* 🟣 **Púrpura / Indigo** (`#7C4DFF`)
* 🟢 **Verde Esmeralda** (`#00A884`)
* 🔵 **Azul Elétrico** (`#0091FF`)
* 🟠 **Laranja Solar** (`#FF8A00`)
* 🌸 **Rosa Neon** (`#EC4899`)
* 🔴 **Vermelho Carmim** (`#EF4444`)

### 3. Geometria das Bordas (`--card-radius`)
* **Ultra-Redondo**: `25px` (Padrão Finly)
* **Moderno**: `16px`
* **Reto**: `8px`

---

## 🌍 Motor de Internacionalização (i18n)

Implementado em `src/utils/i18n.ts`:

* **Idiomas Suportados**:
  * 🇧🇷 Português (Brasil) - `pt-BR`
  * 🇺🇸 English (United States) - `en-US`
  * 🇪🇸 Español (España / Latam) - `es-ES`
* **Formatação Monetária**:
  * `BRL` (R$ 1.250,00)
  * `USD` ($1,250.00)
  * `EUR` (€1.250,00)

---

## ⚙️ Instalação, Execução e Build

### Requisitos:
* **Node.js**: Versão 18.x ou superior.
* **NPM**: Versão 9.x ou superior.

### Comandos de Desenvolvimento:

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento Vite
npm run dev

# 3. Compilar para produção Web
npm run build

# 4. Sincronizar com Android (Capacitor)
npm run cap:sync

# 5. Abrir no Android Studio
npm run cap:open
```

### Serviço Backend API (`server/apiServer.js`):

```bash
npm run server
```

---

## 🚀 Guia de Deploy & Produção

### 1. Deploy Automático na VPS (Oracle Cloud com Docker):
O projeto conta com script PowerShell pronto para empacotar e atualizar o container Docker em produção:

```powershell
npm run deploy:vps
# Executa: powershell -ExecutionPolicy Bypass -File ./scripts/deploy-vps.ps1
```

### 2. CI/CD no GitHub Actions (Android APK Release):
A cada push ou pull request na branch `main`, o GitHub Actions:
- Compila a aplicação Web (`npm run build`).
- Sincroniza os assets no Capacitor Android (`npx cap sync android`).
- Gera o arquivo `.apk` de produção assinado.
- Cria uma release oficial no GitHub com download direto do APK e changelog detalhado.

### 3. Vercel / Netlify / Cloudflare Pages (Web):
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Rewrite Rules**: Adicionar regra `/* -> /index.html` para suporte a rotas diretas.

---

## 🧩 Extensibilidade & Banco de Dados

O estado global em `FinancialContext.tsx` está estruturado com arquitetura desacoplada:

1. **Persistência Atual**: `localStorage` no frontend com sincronização periódica via API REST (`server/apiServer.js`) e suporte a importação/exportação de backups JSON.
2. **Integração com Backend Remoto**:
   - Para conectar com **Supabase**, **PostgreSQL** ou **Firebase**, basta substituir as chamadas do `localStorage` em `FinancialContext.tsx` pelas funções assíncronas da sua API REST/GraphQL.

---

## 📋 Changelog e Versões

Consulte o arquivo [`CHANGELOG.md`](CHANGELOG.md) para o histórico completo de novidades, melhorias e correções a cada versão.
