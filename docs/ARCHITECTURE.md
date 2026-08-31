# 🏛️ PlannerFin — Documentação de Arquitetura do Sistema

O **PlannerFin** é uma plataforma completa de planejamento e inteligência financeira pessoal e familiar, desenvolvida com tecnologia moderna em **React 18 + TypeScript + Tailwind CSS** no frontend e **Node.js (Express + Nodemailer)** no backend.

---

## 1. Visão Geral da Arquitetura

O sistema opera no modelo **Single Page Application (SPA)** com persistência híbrida e sincronização contínua:
* **Frontend SPA**: React 18 com Vite, Tailwind CSS para design system e tema dinâmico (Dark/Light), Recharts para BI e Lucide Icons.
* **Camada de Estado Reativo**: Context API (`FinancialContext`, `AuthContext`, `ConfirmContext`) com cálculo automático de métricas em tempo real.
* **Persistência Híbrida**: `localStorage` no navegador (Zero-Latency Offline-First) + Sincronização automática com API Backend (`server/apiServer.js`) em arquivos JSON isolados por usuário (`server/data/stores/{userId}.json`).
* **Serviço de Mensageria (SMTP)**: Integração nativa com Gmail SMTP autenticado para verificação de e-mails em dois fatores.

```
+-----------------------------------------------------------------------------+
|                                CLIENTE (WEB / PWA)                          |
|                                                                             |
|  +------------------+  +------------------+  +---------------------------+  |
|  |  React UI Views  |  | FinancialContext |  | LocalStorage Cache Engine |  |
|  |  (Mobills-Style) |  | (Reactive State) |  | (Offline First Resilient) |  |
|  +--------+---------+  +--------+---------+  +-------------+-------------+  |
+-----------|---------------------|--------------------------|----------------+
            |                     |                          |
            | HTTP / REST API     | Auto Sync                | Local Fallback
            v                     v                          v
+-----------------------------------------------------------------------------+
|                                BACKEND (NODE.JS)                            |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | Express Server (Port 3000 / 3001)                                     |  |
|  |  • /api/auth (Login, Cadastro, Atualização de Perfil)                 |  |
|  |  • /api/sync/:userId (Sincronização Bidirecional de Estado)           |  |
|  |  • /api/send-verification-code & /api/verify-code (SMTP Gmail 2FA)     |  |
|  |  • Static SPA Fallback Middleware (Entrega de Assets Vite 'dist/')    |  |
|  +-----------------------------------------------------------------------+  |
|                                     |                                       |
|                                     v                                       |
|  +-----------------------------------------------------------------------+  |
|  | Storage Engine (JSON File System / Volume Persistente)                |  |
|  |  • server/data/users.json (Base de Usuários)                          |  |
|  |  • server/data/stores/{userId}.json (Transações, Contas, Cartões,     |  |
|  |    Categorias, Orçamentos, Metas, Configurações de Tema e Família)    |  |
|  +-----------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------+
```

---

## 2. Estrutura de Diretórios

```text
planner-financeiro/
├── src/
│   ├── components/
│   │   ├── auth/              # Telas de Login, Cadastro e Recuperação de Senha
│   │   ├── cadastros/         # Modais de Contas, Cartões e Categorias
│   │   ├── calendario/        # Visão Mensal e Diária de Movimentações
│   │   ├── configuracoes/     # Personalização de Tema, Moeda e Família
│   │   ├── dashboard/         # Dashboard Mobills (KPIs, Donut, Cartões, Contas)
│   │   ├── layout/            # Topbar, Sidebar, Floating Action Button (+)
│   │   ├── relatorios/        # Gráficos de Evolução, Categorias e Balanço
│   │   ├── transactions/      # Listagem Timeline/Table, Modal (+) e Ficha Detalhe
│   │   └── ui/                # Componentes Reutilizáveis (Modal, Confetti, Badges)
│   ├── context/
│   │   ├── AuthContext.tsx    # Gerenciamento de Sessão e Perfil de Usuário
│   │   ├── ConfirmContext.tsx # Modais de Confirmação Interativos
│   │   └── FinancialContext.tsx # Motor Central de Cálculo e Persistência
│   ├── types/                 # Interfaces TypeScript do Modelo Financeiro
│   └── utils/
│       ├── bankLogos.tsx      # Logos SVG de Bancos e Bandeiras de Cartão
│       ├── formatters.ts      # Formatadores de Moeda BRL, Datas e Números
│       └── invoiceCalculator.ts # Motor de Alocação de Faturas e Regime Contábil
├── server/
│   ├── apiServer.js           # Servidor REST Express + SMTP + SPA Static Server
│   └── data/                  # Diretório de Persistência JSON
├── public/                    # Manifest PWA, Ícones e Assets Estáticos
├── Dockerfile                 # Multi-Stage Build de Produção
├── docker-compose.yml         # Orquestração de Contêineres
├── ecosystem.config.cjs       # Gerenciamento de Processos PM2
└── deploy.sh                  # Script de Deploy de 1-Clique na VPS
```
