# Finly - Diretrizes e Regras Operacionais para Agentes AI

Este documento estabelece as diretrizes obrigatórias de governança de código, rotinas de deploy, sincronização de documentação e regras operacionais para o desenvolvimento do **Finly (Web & Android)**.

---

## 1. Regras Operacionais Mandatórias (Plano de Ação)

### 📌 Regra 1: Sincronização Contínua do Helpdesk & Central de Ajuda
- **Gatilho**: Sempre que houver alteração visual, reorganização de menus, criação/remoção de abas, mudança de botões, atalhos de navegação ou fluxo de telas.
- **Ação Obrigatória**:
  1. Atualizar a base de dados de suporte e tutoriais em `src/data/helpCenterData.ts`.
  2. Ajustar os passos visuais dos guias (`HELP_GUIDES`), callouts interativos e perguntas frequentes (`HELP_FAQS`) refletindo com precisão os novos caminhos na Web e no App Android.
  3. Garantir que o usuário final encontre respostas alinhadas com a versão mais recente em execução.

---

### 📌 Regra 2: Cadência de Ciclos (A Cada 4 Mudanças / Tarefas)
- **Gatilho**: Ao acumular **4 alterações/funcionalidades/correções concluídas** no projeto.
- **Ações Obrigatórias do Ciclo**:
  1. **Validação Técnica**:
     - Executar checagem de tipos: `npx tsc --noEmit`.
     - Executar build de produção: `npm run build`.
  2. **Git Commit Semântico & Push**:
     - Registrar commit claro com mensagem semântica (ex: `feat: ...`, `fix: ...`, `refactor: ...`).
     - Realizar push para o repositório remoto: `git push origin main`.
  3. **Deploy Automatizado no Servidor VPS (Oracle Cloud)**:
     - Executar o script de implantação em produção:
       ```powershell
       powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vps.ps1
       ```
     - Validar que a API, serviço de email e frontend em produção estejam operacionais.
  4. **Atualização da Documentação & Notas de Versão**:
     - Atualizar notas e documentações do projeto (`README.md`, `CHANGELOG.md`, `walkthrough.md` e releases do GitHub se aplicável).

---

## 2. Identidade Visual & Design System Finly
- **Paleta Oficial**:
  - Primária: Gradiente Púrpura / Indigo (`#6366f1` / `#7c3aed` / `#a855f7`).
  - Superfícies Dark: Tons profundos e elegantes (`#121215`, `#1C1C1E`, `#2C2C2E`).
  - Acentos: Cores semânticas consistentes (Verde Esmeralda para receitas/sucesso, Carmim/Rose para despesas/alertas, Âmbar para cartões).
- **Proibições Estritas**:
  - Nunca utilizar logos, nomes ou cores legadas do "PlannerFin" ou caixas verdes com a letra "P".
  - Comunicações por e-mail, telas de login e modais devem sempre carregar a marca **Finly**.

---

## 3. Arquitetura de Segurança & Acesso
- **Centralização em Meu Perfil (`ProfilePage.tsx`)**:
  - Alteração de senha da conta (`Segurança & Alteração de Senha`).
  - Bloqueio biométrico (impressão digital / TouchID / FaceID) e PIN numérico de 4 dígitos (`Bloqueio Biométrico & PIN`).
- **Aba Mais Opções (`MorePage.tsx`)**:
  - Mantida leve e limpa, segmentada exclusivamente entre **Geral** (atalhos rápidos) e **Sobre** (versão, novidades e download de APK).

---

## 4. Modo Operacional Interativo (Codex / Claude Code Style)
- **Comunicação Proativa**: Informar o que será investigado e o próximo passo antes e durante tarefas longas (mensagens curtas de 1 a 3 frases a cada 2-4 etapas).
- **Descobertas Imediatas**: Notificar causas-raiz, inconsistências ou riscos assim que detectados, sem guardar para o final.
- **Ciclo Padronizado**: `Investigar → Explicar → Planejar → Implementar → Validar (Build/Testes) → Resumir`.
- **Anti-Spam**: Agrupar ações correlacionadas em vez de narrar comandos triviais individualmente.
- **Resumo Final Estruturado**: Concluído, Arquivos Modificados, Validação e Observações.

