# 📋 Changelog - Finly

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
O formato segue o padrão de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.1.28] - 2026-09-07

### ✨ Novas Funcionalidades
- **Bloqueio Biométrico & PIN Numérico Seguro**:
  - Camada de segurança extra com PIN de 4 dígitos criptografado via Web Crypto API (SHA-256 com salt) e suporte a Biometria nativa/WebAuthn (TouchID, FaceID, impressão digital).
  - Tela de desbloqueio responsiva com teclado numérico tátil, feedback de erro em shake, temporizador de bloqueio por inatividade e contingência por senha.
- **Exportação para Excel (.xlsx) Formatado**:
  - Geração nativa de pastas de trabalho corporativas utilizando SheetJS (`xlsx`) com abas de Resumo Executivo (KPIs e distribuição de despesas), Lançamentos Detalhados com fórmulas e Posição de Contas/Cartões.
- **Desafios de Economia (Savings Challenges)**:
  - Módulo gamificado em Metas para incentivar a disciplina de poupança (Desafio das 52 Semanas, 52 Semanas Turbo x2, Caixa Rápido 30 Dias e Detox Sem Delivery) com grade interativa de semanas/dias e animações de confetes.
- **Categorização Automática com Aprendizado (Smart Auto-Categorization)**:
  - Motor inteligente com dicionário pré-carregado de centenas de estabelecimentos brasileiros e algoritmo de aprendizado ativo sobre os lançamentos históricos do usuário. Sugestões em tempo real no cadastro e auto-classificação de extratos OFX/CSV.

### ⚡ Melhorias & Refinamentos
- **Interface de Transações Simplificada**:
  - Remoção do botão redundante `+ NOVO` no topo da tela de Transações, centralizando a adição no botão flutuante `+` da barra inferior.
- **Barra Superior Mais Limpa**:
  - Remoção do botão de ajuda do header superior, mantendo o acesso disponível pelo menu do usuário e pela aba Mais.
- **Compatibilidade Android & Gradle**:
  - Configuração do runtime Java 17 LTS no ambiente de build do Android Gradle Plugin 8.x.

---

## [1.1.27] - 2026-09-07

### ✨ Novas Funcionalidades
- **Notificação com Botão Desfazer Exclusão (Undo Toast)**:
  - Sistema universal de restauração com janela de 5 segundos e barra de progresso visual para recuperar transações, contas, cartões, dívidas ou categorias deletadas acidentalmente.
- **Edição Completa de Dívidas e Financiamentos**:
  - Novo modal com suporte a alteração de valor financiado, saldo restante, parcelas pagas/totais, taxa de juros (% a.m./a.a.), próximo vencimento e credor.
- **Exportação Completa de Faturas em CSV e PDF**:
  - Exportação fiel dos lançamentos de faturas individuais via `Blob` com codificação `UTF-8 BOM` e relatório executivo em PDF corporativo.
- **Cartões na Barra de Navegação Inferior**:
  - Acesso direto e prioritário aos cartões de crédito na `BottomNav` mobile, substituindo a aba de planejamento.

### 📱 Experiência Mobile & Android
- **Predictive Back Gestures & Fechamento de Modais**:
  - Suporte nativo a gestos de voltar do Android 13/14/15 (`enableOnBackInvokedCallback="true"`). Ao realizar o gesto de voltar (swipe da borda), qualquer modal de adição é dispensado instantaneamente sem sair do app nem trocar de tela.
- **Remoção de Redimensionamento Indesejado no App**:
  - Ocultados os botões de expandir e arrastar cards na visualização móvel, preservando rolagem touch suave.

### ⚡ Melhorias & Refinamentos
- **Configurações em 2 Colunas**:
  - Redesenho da tela de configurações separando claramente **Preferências do Sistema** (Idioma, Aparência, Notificações, Widgets) de **Segurança & Login** (Dados cadastrais, Senha, Criptografia, Backup).
- **Aba Sobre Enxuta**:
  - Design limpo com Central de Ajuda recolhível no rodapé para máxima economia de espaço.

---

## [1.1.26] - 2026-09-06

### ✨ Novas Funcionalidades
- **Arquitetura Supabase / PostgreSQL com Row Level Security (RLS)**:
  - Migração de persistência para Supabase com banco de dados PostgreSQL estruturado e isolado por usuário (`auth.uid() = user_id`).
  - Criação de migration SQL reprodutível (`supabase/migrations/20260906000000_initial_schema.sql`) contemplando `profiles`, `accounts`, `credit_cards`, `categories`, `transactions`, `budgets`, `goals`, `debts`, `investments`, `family_members` e `notifications`.
- **Autenticação com Supabase Auth**:
  - Integração nativa do `AuthContext` com o Supabase Auth para login, cadastro e recuperação de conta.
  - Modo híbrido com preservação do modo Demonstração (`demo@finly.com`) e resiliência offline.
- **Script de Migração Automatizada de Dados Locais**:
  - Script executável (`scripts/migrate-stores-to-supabase.js`) para ler os arquivos JSON em `server/data/stores/` e fazer o upsert estruturado no PostgreSQL do Supabase.

### ⚡ Melhorias & Otimizações
- **Camada de Repositório Tipada (`supabaseDb.ts`)**:
  - Métodos fortemente tipados para sincronização completa e granular de lançamentos, contas, cartões e categorias.
- **Compatibilidade 100% Preservada com Capacitor & Android**:
  - Persistência e tokens armazenados localmente garantindo funcionamento transparente tanto na Web quanto no aplicativo Android.

---

## [1.1.25] - 2026-09-06

### ✨ Novas Funcionalidades
- **Visualização 100% Idêntica ao App Android (`FinlyAndroidMockup.tsx`)**:
  - Novo simulador interativo na Central de Ajuda reproduzindo com exatidão a interface do aplicativo Android (Dynamic Island/entalhe, relógio e status do sistema, cabeçalho oficial, menu em arco do Speed Dial com 4 botões e cartões de crédito realistas com chip EMV e botão de pagar fatura).
- **Central de Ajuda Dedicada ao Mobile**:
  - Quando acessada pelo aplicativo Android, os seletores e blocos de instrução da versão Desktop são automaticamente ocultados, oferecendo uma experiência 100% limpa e focada no celular.

### ⚡ Melhorias & Otimizações
- **Separação Estruturada dos Logs de Versão**:
  - Implementação do componente `ReleaseLogView` para agrupar destaques entre Novas Funcionalidades, Correções & Fixes e Melhorias na aba Sobre, no modal de novidades e no endpoint da API.

---

## [1.1.24] - 2026-09-06

### ✨ Novas Funcionalidades
- **Central de Ajuda & Tutoriais Visuais (`HelpCenterPage.tsx`)**:
  - Nova central completa de documentação com tutoriais passo a passo para Web e Android.
  - Diagramas visuais interativos com marcações e pinos numerados para orientar novos usuários em cada fluxo financeiro.
  - Seções dedicadas: Lançamentos & Contas, Cartões de Crédito & Faturas, Metas Financeiras, Orçamentos, Importação Bancária OFX e Configurações/Atualizações.
  - Acesso direto a partir da barra lateral (`HelpCircle`) e atalhos rápidos.
- **Tela de Boas-Vindas no App Android**:
  - Exibição automática do modal de novidades no primeiro acesso após atualizar o app nativo Android, com suporte ao botão físico de voltar.

### 🐛 Correções & Fixes
- **Eliminação de Salto Desnecessário de Telas/Modais**:
  - Ao clicar na aba **Atualizações & Sobre o Finly** ou no botão **Verificar Atualização**, o app agora navega e atualiza o status diretamente na página, sem abrir modais sobrepostos indesejados.
  - O fluxo de navegação do menu de usuário (`Header.tsx`) e da central Mais Opções (`MorePage.tsx`) agora direciona suavemente para a página Sobre sem pop-ups intrusivos.
- **Fim das Notificações Repetidas e Invasivas na Barra de Status**:
  - Removido o disparo de notificações locais com som e vibração que avisavam "✓ Finly Atualizado" quando o aplicativo já estava na versão mais recente. A confirmação agora é exibida exclusivamente no card visual na tela.
  - Bloqueada a reemissão de notificações para a mesma versão já comunicada.

### ⚡ Melhorias & Otimizações
- **Separação Estruturada dos Logs de Versão**:
  - Registro e exibição categorizada de atualizações entre *Novas Funcionalidades*, *Correções & Fixes* e *Melhorias & Otimizações*, aplicados à aba Sobre (`MorePage.tsx`), ao modal de novidades (`WebWhatsNewModal.tsx`), à API do backend (`version.json`) e ao `CHANGELOG.md`.
- **Deduplicação de Verificações em Paralelo (Request Lock)**:
  - Implementada trava Promise em `appUpdateService.ts` (`activeCheckPromise`) para que múltiplas chamadas concorrentes ao abrir a aba não disparem requisições de rede ou eventos duplicados em paralelo.

---

## [1.1.23] - 2026-09-06

### 🐛 Correções e Estabilidade
- **Sincronização Definitiva de Versões (Fonte Única da Verdade)**:
  - Criado o registro central `src/data/releases.ts` e endpoint dinâmico `server/data/version.json` no backend, eliminando discrepâncias onde o app, servidor e build ficavam em versões diferentes.
  - O pipeline de CI/CD do GitHub Actions (`build-apk.yml`) agora deriva a versão e tags oficiais diretamente do `package.json`.
- **Fim das Notificações Repetidas e Falsos Positivos**:
  - Corrigida a condição em `UpdateNoticeCard.tsx` que interpretava qualquer versão diferente como atualização pendente mesmo se fosse mais antiga.
  - Implementada deduplicação via `localStorage` em `appUpdateService.ts`: alertas só são disparados quando houver uma versão estritamente mais recente (`isNewerVersion`) e nunca se repetem na mesma versão.
- **Notas de Versão Dinâmicas e Histórico Completo no App**:
  - Substituídas as notas estáticas/chumbadas da aba Sobre (`MorePage.tsx`) por destaques reais gerados dinamicamente.
  - Adicionado menu expansível de histórico de versões anteriores para que o usuário possa consultar todos os lançamentos passados diretamente no app.

---

## [1.1.22] - 2026-09-06

### ✨ Novidades e Funcionalidades
- **Lista Detalhada de Lançamentos ao Pagar Fatura**: Ao clicar em "Pagar Fatura" em qualquer ponto do app (aba Cartões ou Dashboard), o modal agora exibe a lista completa de lançamentos da fatura com ícone de categoria colorido, badge de parcela (ex: 2/5), subcategoria, data e status (Pago/Aberto).
- **Skills de Otimização de Agente**: Adicionadas skills `context-pruning` (economia de tokens) e `pre-action-guard` (detecção de loops e ações redundantes) para melhorar a eficiência do assistente de desenvolvimento.

### 🎨 Melhorias Visuais
- **Reordenação dos Botões de Ação Rápida (Speed Dial)**: Nova ordem lógica: 1) Receita, 2) Despesa, 3) Despesa Cartão, 4) Transferência.
- **Ícone de Despesas por Categoria**: Emoji 🍩 substituído por ícone vetorial `PieChart` (Lucide) no card do dashboard para visual mais limpo e consistente.

---

## [1.1.21] - 2026-09-06

### 🐛 Correções e Melhorias no Aplicativo Mobile
- **Correção da Verificação de Atualizações no App Android**:
  - Ajustado o roteamento de endpoints no ambiente Capacitor nativo (`apiConfig.ts`) para apontar automaticamente para o servidor de produção `https://finly.lpaguiar.com.br`, evitando falhas de conexão de rede em `http://localhost`.
  - Adicionado fallback automático resiliente para o servidor de produção caso o endpoint principal falhe.
- **Notificações em Tempo Real de Novas Versões**:
  - Disparo automático de notificações nativas no Android (`@capacitor/local-notifications`) e banner toast visual no app (`InAppNotificationToast`) quando uma nova versão for detectada.
  - Alertas de atualização prioritários não são silenciados por preferências gerais de notificação.
- **Abertura Imediata do Modal de Atualização (`AppUpdateModal`)**:
  - Ao tocar em "Verificar Atualização", "Atualizações do App" ou no aviso flutuante, a central de atualização é aberta imediatamente com verificação em tempo real, changelog e botão direto para download do APK via navegador padrão do celular.
  - Suporte ao botão físico de voltar do Android (`useBackButton`) para fechar o modal suavemente.

---

## [1.1.19] - 2026-09-06

### 🐛 Correções e Estabilidade
- **Correção de Layout Flexbox no Card de Despesas por Categoria**: Solucionado o bug visual no layout horizontal do card de "Despesas por Categoria", onde o rodapé competia horizontalmente no mesmo contêiner flex e esmagava a lista de categorias para largura zero. Agora estruturado com contêiner dedicado para a coluna da direita com barras de progresso, percentuais de aderência ao orçamento e botão de relatórios perfeitamente alinhado.
- **Suporte Horizontal Expandido para Receitas por Categoria**: Implementado o mesmo padrão de duas colunas responsivo para o card de "Receitas por Categoria".

---

## [1.1.18] - 2026-09-06

### ✨ Novidades e Funcionalidades
- **Redimensionamento Dinâmico de Cards no Web**: Capacidade de alternar qualquer card do dashboard entre 1 coluna (meia largura) e 2 colunas (largura total) diretamente pela barra de ação ao passar o mouse ou pelo modal "Gerenciar Tela Inicial".
- **Card de Despesas por Categoria Horizontal**: Layout horizontal padrão com gráfico de Donut colorido à esquerda (valores compactos de despesas variáveis e fixas) e lista detalhada com barras de progresso contínuas à direita.
- **Unificação do Menu de Perfil e Configurações**: Ícone de engrenagem de configurações integrado dentro do botão de perfil do usuário tanto na Web quanto no Mobile.

### 🐛 Correções e Estabilidade
- **Correção da Abertura/Fechamento Automático de Transações**: Solucionado o problema de *ghost-click / click-through* no backdrop do modal ao tocar em transações no smartphone, adicionando supressão temporal e verificação estrita de toque.
- **Blindagem do Hook de Gestos de Voltar (`useBackButton`)**: Prevenção de loops de `popstate` durante remounts rápidos e reversões de histórico no navegador web e PWA.
- **Suporte ao Entalhe de Tela (*Notch*) no Android**: Ajustadas as configurações de janela nativa e variáveis CSS de `safe-area-inset-top` e `safe-area-inset-bottom` para evitar cortes de conteúdo sob a barra de status e entalhe da câmera.
- **Exibição do Botão e Modal de Pagar Fatura**: Corrigida a renderização do botão "Pagar Fatura" e o corte de conteúdo no modal de quitação da fatura de cartão de crédito.

---

## [1.1.17] - 2026-09-06

### 🎨 Melhorias Visuais e de Layout
- **Modais Centralizados Responsivos**: Uniformização de todos os modais da aplicação com cantos arredondados (`rounded-[24px]` a `[28px]`), sombras profundas e rolagem acelerada por hardware com rodapé fixo.
- **Aprimoramento das Faturas de Cartão**: Ajustes visuais nos lançamentos e badges de status de pagamento de fatura.

---

## [1.1.3] - 2026-09-06

### 🚀 Atualizações e Integrações
- **Sistema Inteligente de Atualizações**: Notificação e download de novas releases do APK com comparação semântica de versões diretamente pelo aplicativo.
- **CI/CD Automatizado no GitHub Actions**: Workflow para compilação automática do APK Android e publicação de releases com changelog dinâmico.

---

## [1.0.0] - 2026-08-20

### 🌟 Lançamento Inicial
- Gestão financeira completa: receitas, despesas, transferências e dívidas.
- Múltiplas contas bancárias e cartões de crédito com cálculo automático de faturas e limites.
- Gráficos interativos com Recharts, controle de orçamentos e planejamento financeiro.
- Suporte offline, PWA e exportação/importação de extratos OFX.
