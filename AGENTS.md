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

---

## 5. Idioma Obrigatório das Interações
- **Português (pt-BR) Estrito**: Todas as comunicações, mensagens de progresso, esclarecimentos, planos de ação e resumos finais devem ser formulados exclusivamente em **Português do Brasil (pt-BR)**.

---

# 7. Tempo decorrido e consumo de tokens

Quero também uma experiência visual semelhante ao Codex CLI durante e após a execução das tarefas.

Configure o Antigravity para exibir, sempre que tecnicamente possível:

* tempo decorrido da execução;
* tokens de entrada;
* tokens de saída;
* tokens de raciocínio/thinking;
* tokens lidos do cache;
* total de tokens consumidos;
* percentual da janela de contexto utilizada, quando disponível;
* modelo atualmente utilizado.

## Prioridade de implementação

NÃO invente ou estime valores de tokens.

Os números devem vir exclusivamente das métricas reais fornecidas pelo Antigravity/Gemini.

Use, nesta ordem de preferência:

1. Status Line nativa do Antigravity;
2. metadados de uso fornecidos pelo runtime;
3. hooks/lifecycle telemetry oficialmente suportados;
4. output JSON/headless do Antigravity;
5. apenas como último recurso, um script local que consuma essas métricas oficiais.

Não conte caracteres ou palavras para estimar tokens.

---

# 8. Status Line estilo Codex

Verifique se esta instalação possui suporte ao comando:

/statusline

e à configuração:

~/.gemini/antigravity-cli/settings.json

Se disponível, configure uma Status Line global.

Ela deve ser compacta e semelhante a:

⏱ 02:34  |  🤖 Gemini 3.5 Pro  |  🪙 18.4k tokens  |  🧠 32% context

Durante execução, quando possível:

⏱ 01:42  |  ⚙ working  |  🪙 12.8k  |  🧠 24%

Quando estiver usando ferramentas:

⏱ 02:08  |  🔧 tool_use  |  🪙 15.1k  |  🧠 29%

Não precisa usar exatamente esses emojis caso isso prejudique a renderização no terminal.

Prefira uma linha limpa.

## Informações desejadas

Se o payload da Status Line disponibilizar estes campos, utilize:

* model.display_name
* agent_state
* context_window.total_input_tokens
* context_window.total_output_tokens
* context_window.context_window_size
* context_window.used_percentage
* context_window.remaining_percentage
* quota

Calcule o total exibido apenas a partir dos valores oficiais disponíveis.

---

# 9. Cronômetro

Quero que o tempo mostrado represente o tempo real decorrido da tarefa atual.

Formato:

< 60 segundos:
⏱ 42s

>= 60 segundos:
⏱ 2m 14s

>= 1 hora:
⏱ 1h 07m

Se a API/status line nativa fornecer duração real, utilize-a.

Se não fornecer duração durante a execução, implemente um cronômetro local baseado no início e fim da execução, sem interferir no agente.

O cronômetro deve ser apenas observabilidade.

Não deve:

* bloquear comandos;
* alterar permissões;
* alterar respostas;
* reiniciar o agente;
* consumir chamadas adicionais ao modelo apenas para atualizar o relógio.

---

# 10. Tokens por tarefa

Ao finalizar uma tarefa, mostre um pequeno resumo de consumo, quando as métricas estiverem disponíveis.

Formato desejado:

────────────────────────────
✅ Concluído

⏱ Tempo: 3m 42s
🪙 Tokens: 28.450
├─ Entrada: 19.820
├─ Saída: 3.240
├─ Thinking: 5.390
└─ Cache: 12.100

🧠 Contexto: 34%
────────────────────────────

IMPORTANTE:

O campo Cache pode estar incluído dentro de outras métricas dependendo da API.

Não some tokens de cache duas vezes.

Utilize a definição oficial do runtime.

Se `total_tokens` já for fornecido pelo Antigravity, utilize esse valor diretamente em vez de recalcular.

---

# 11. Telemetria real

Investigue os recursos atuais desta versão do Antigravity antes de implementar.

Procure especificamente suporte para:

* /statusline
* /usage
* /quota
* usage_metadata
* duration_seconds
* context_window
* agent_state
* hooks
* lifecycle events
* transcript metadata

Utilize somente interfaces oficialmente disponíveis nesta instalação.

Não crie polling desnecessário contra APIs.

---

# 12. CLI / Headless

Verifique também o funcionamento do modo headless do Antigravity.

Se disponível, confirme se algo equivalente a:

agy -p "..." --output-format json

retorna métricas como:

duration_seconds
usage.input_tokens
usage.output_tokens
usage.thinking_tokens
usage.cache_read_tokens
usage.total_tokens

Use isso como referência para validar os valores apresentados pela configuração.

Não altere meu fluxo normal no IDE para headless somente para conseguir as métricas.

---

# 13. Hooks de observabilidade

Se Agent Hooks/Lifecycle Hooks estiverem disponíveis nesta instalação, avalie utilizá-los para observabilidade.

Eles podem ser usados para:

* registrar início da tarefa;
* registrar fim da tarefa;
* capturar duração;
* capturar usage_metadata;
* registrar execução de ferramentas;
* produzir métricas.

NÃO use hooks para modificar silenciosamente minhas solicitações.

NÃO use hooks para aprovar comandos automaticamente.

A finalidade aqui é somente observabilidade.

---

# 14. Histórico opcional

Se for simples e oficialmente suportado, crie opcionalmente um arquivo local de métricas:

~/.gemini/metrics/agent-usage.jsonl

Cada execução poderia registrar algo semelhante a:

{
"timestamp": "...",
"model": "...",
"duration_seconds": 142,
"input_tokens": 19820,
"output_tokens": 3240,
"thinking_tokens": 5390,
"cache_read_tokens": 12100,
"total_tokens": 28450
}

Faça isso SOMENTE se os dados puderem ser obtidos diretamente do runtime.

Nunca coloque:

* prompts;
* conteúdo de arquivos;
* respostas completas;
* senhas;
* tokens de API;
* informações sensíveis

nesse histórico.

Registre somente metadados técnicos.

---

# 15. Validação da configuração

Depois de implementar:

1. mostre o conteúdo relevante de `settings.json`;
2. mostre o script da Status Line, caso tenha sido criado;
3. informe quais campos reais esta versão do Antigravity disponibiliza;
4. execute uma tarefa curta de teste;
5. compare os tokens exibidos com os metadados oficiais;
6. confirme se o cronômetro está funcionando;
7. confirme se funciona depois de reiniciar o Antigravity.

Se alguma dessas funcionalidades só existir no Antigravity CLI e não dentro da interface visual do Antigravity IDE, informe claramente essa limitação.

Não simule suporte inexistente.


