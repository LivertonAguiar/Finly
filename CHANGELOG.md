# 📋 Changelog - Finly

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
O formato segue o padrão de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

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
