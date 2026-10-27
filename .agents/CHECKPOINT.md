# Finly - Ponto de Recuperação Contínua & Checkpoint de Sessão (Resilience & Continuity)

> **Finalidade**: Este arquivo serve como o registro mestre de persistência entre sessões de IA, quedas de energia, falhas de conexão ou esgotamento de janela de contexto/tokens. Qualquer agente que assumir a conversa ou reiniciar o ciclo DEVE consultar este documento como primeiro passo.

---

## 1. Identificação do Projeto e Ambientes Ativos

- **Projeto**: Finly (Planner Financeiro Web & Mobile Android)
- **Repositório Git**: `https://github.com/LivertonAguiar/Finly.git` (`branch: main`)
- **Versão Atual**: `1.1.80` (validada por `npm run check:version` em 6 fontes sincronizadas)
- **Servidor de Produção (VPS Oracle Cloud ARM64)**:
  - IP: `147.15.74.236` | Alias SSH: `finly-vps` | Usuário: `ubuntu`
  - Chave SSH: `C:\Users\Suporte\Downloads\Oracle\ssh-key-2026-08-24.key`
  - Diretório de Deploy: `/opt/docker/finly`
  - Domínio Público: `https://finly.lpaguiar.com.br`
  - Containers Docker Ativos: `finly-app` (porta 3000), `supabase-*`, `nginx-proxy-manager`
- **Capacitor Mobile (Android)**:
  - App ID: `com.plannerfin.app`
  - Compilação do APK: Exclusivamente via GitHub Actions (`.github/workflows/build-apk.yml`), nunca localmente.

---

## 2. Regras Críticas e Invioláveis de Governança

1. **Política Estrita de SMTP (Gmail Pessoal `liverton.aguiar.sup@gmail.com`)**:
   - **NUNCA** disparar e-mails para endereços de teste ou fictícios (ex: `@finly.com`, `@example.com`).
   - O Gmail pessoal tentará entregar por 72 horas e inundará a caixa de entrada do usuário com bounces de DNS (`NXDOMAIN`).
   - Testes de SMTP devem rodar apenas `transporter.verify()` sem enviar mensagens.
2. **Ciclo Padronizado de Releases (Regra de 4 Mudanças)**:
   - Incrementar versão semântica (`package.json`, `package-lock.json`, `src/data/releases.ts`, `README.md`, `CHANGELOG.md` e `helpCenterData.ts`).
   - Validar com `npm run check:version`.
   - Executar testes e build: `npm run test:all-debts`, `npx tsc --noEmit`, `npm run build`, `npm run cap:sync`.
   - Commit semântico e push para `main`.
   - Aguardar build do APK no GitHub Actions antes de disparar o deploy VPS.
   - Deploy VPS via `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vps.ps1`.
3. **Idioma Obrigatório**: Todas as mensagens, documentações e comunicações estritamente em **Português do Brasil (pt-BR)**.

---

## 3. Registro de Descobertas e Soluções Recentes (Base de Conhecimento)

### A. Despesa marcada como paga voltando para pendente no celular
- **Causa Raiz**: O `toggleTransactionStatus` apenas alterava o estado em memória e dependia do `saveEntireStore` disparado por `useEffect`. Em redes instáveis ou lentas no mobile, o salvamento demorava. Ao fazer pull-to-refresh (`refreshData`), o snapshot antigo vindo do Supabase sobrescrevia a transação porque não existia diário de mutações pendentes.
- **Solução Implementada**:
  - Criado diário de mutações locais com persistência em `localStorage` (`pendingTxMutationsRef` e `finly_pending_tx_mutations_v1`).
  - Salvamento atômico imediato em background via `supabaseDb.upsertTransaction`.
  - Reconciliação inteligente com `reconcilePendingMutations`: snapshots remotos nunca sobrescrevem mutações locais pendentes.

### B. Saldo oscilando rapidamente ao atualizar (Flicker)
- **Causa Raiz**: O `refreshData` atribuía às contas os saldos estáticos brutos vindos do banco; o React renderizava e, milissegundos depois, o efeito de recálculo derivado recalculava com base nas transações e disparava `setAccounts` novamente.
- **Solução Implementada**:
  - O utilitário `calculateDerivedAccountBalances` agora é executado antes do primeiro `setAccounts` em todas as rotinas de carregamento e refresh (`loadUserStore`, fetch Supabase, fetch Express, `refreshData`).
  - As contas entram no estado React já com seus saldos derivados consolidados, zerando oscilações visuais.

### C. Edição de despesa detalhada (Split) descartada / não fixada
- **Causa Raiz**:
  - No `TransactionModalV2`, edições com escopo pontual (`fixedEditScope === 'single'`) não atribuíam `isSeriesException: true`. A rotina `reconcileRecurringExpenseSeries` re-projetava os templates da série sobre a ocorrência, sobrescrevendo a edição do usuário.
  - O modal fundia templates da série forçadamente mesmo se o usuário os tivesse removido intencionalmente daquela ocorrência.
- **Solução Implementada**:
  - `TransactionModalV2.tsx`: Ao salvar edição de fatura/despesa com split no escopo `'single'`, invoca `updateRecurringExpenseComponents(..., 'single', ...)` e marca `isSeriesException: true`.
  - Guarda `if (seriesTemplates && !tx?.isSeriesException)` adicionada no carregamento de itens para não re-injetar templates excluídos.
  - `TransactionDetailModal.tsx`: Preservar estritamente `rawComponents` caso `transaction?.isSeriesException` seja verdadeiro e marcar `isSeriesException: true` no botão "Sincronizar Valor".

---

## 4. Procedimento de Retomada Pós-Queda de Energia / Fim de Tokens

Se uma sessão anterior foi interrompida abruptamente:
1. **Verificar Status do Git**:
   ```powershell
   git status
   ```
2. **Validar Integridade de Código**:
   ```powershell
   npx.cmd tsc --noEmit
   npm.cmd run test:all-debts
   ```
3. **Inspecionar Este Arquivo (`.agents/CHECKPOINT.md`)**:
   - Ler a seção de "Tarefas Pendentes" abaixo.
   - Retomar exatamente da tarefa marcada como `[ ] (Pendente)` ou `[/] (Em Andamento)`.

---

## 5. Status Atual das Tarefas

- [x] Auditoria de ambiente Local, VPS e GitHub (Concluída - Todos em `1.1.79`).
- [x] Instalação de Skills de Persistência e Execução (`superpowers@executing-plans`, `remember`).
- [x] Correção de despesa marcada como paga voltando para pendente (`FinancialContext.tsx`).
- [x] Correção de oscilação rápida do saldo no pull-to-refresh (`FinancialContext.tsx`).
- [x] Correção de descarte de alterações ao editar despesas detalhadas (`TransactionModalV2.tsx`, `TransactionDetailModal.tsx`, `FinancialContext.tsx`).
- [x] Criação do Ponto de Recuperação Contínua (`.agents/CHECKPOINT.md`).
- [x] Validação técnica (Checagem de tipos tsc, testes automatizados e build de produção Vite).
- [x] Sincronização de assets do Capacitor Android (cap:sync).
- [x] Compilação e publicação do APK Android oficial (`finly-v1.1.80.apk`) no GitHub Actions.
- [x] Deploy completo da aplicação na VPS Oracle Cloud (`deploy-vps.ps1`).
- [x] Publicação do pacote de Live Update OTA (`v1.1.80.1`) com distribuição pública ativa.
- [x] Resumo final estruturado entregue ao usuário.
