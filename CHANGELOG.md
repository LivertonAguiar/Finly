# 📋 Changelog - Finly

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
O formato segue o padrão de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.52] - 2026-09-09

### 🎨 Design System Fikri Studio, Cartão Bradesco Neo Oficial, Teclado Inteligente & Notificações
- **Design System Fikri Studio & Bento Grid**:
  - Novo Hero Balance Card com cantos ergonômicos de `28px`, iluminação radial violeta difusa e métricas monoespelhadas de alta precisão técnica.
  - Micro-pílulas flutuantes para taxa de poupança/consumo (`pill-tag-mint`, `pill-tag-rose`) e cards modulares de receitas e despesas com barras de proporção.
  - Balanço semestral e trimestral atualizados com arquitetura `.bento-card` e tooltips foscos com backdrop blur.
- **Cartão Bradesco Neo Oficial & Credicard On**:
  - Novo tema de alta fidelidade para o cartão Bradesco Neo com gradiente tricolor diagonal (vermelho, violeta e azul) e tipografia espaçada oficial.
  - Inclusão do emissor Credicard On com paleta escura moderna e logotipo dedicado.
- **Teclado Virtual Inteligente sem Cortes**:
  - Integração do `@capacitor/keyboard` com modo `adjustPan` e rolagem dinâmica no Android e Web, garantindo que botões e campos de formulários nunca fiquem escondidos pelo teclado.
- **Centralização de Notificações**:
  - Histórico de notificações desvinculado da aba Mais Opções > Geral e mantido exclusivamente no ícone do sino (`Bell`) no cabeçalho.

## [1.1.51] - 2026-09-09

### 🎨 Desacoplamento e Liberdade de Personalização de Cores (Cartões e Contas)
- **Desacoplamento de Cor e Banco**:
  - A seleção de banco/emissor agora sugere a cor oficial apenas se o usuário ainda não tiver escolhido uma cor personalizada.
  - As cores escolhidas pelo usuário para cartões e contas bancárias são rigorosamente preservadas ao alternar de banco ou editar registros existentes.
- **Seletor Visual Aprimorado**:
  - Adição de paleta de cores elegantes e presets rápidos em `CardModal.tsx` e `AccountModal.tsx`.
  - Inserção direta e edição de códigos hexadecimais (`#HEX`).
  - Botão de 1-clique para restaurar a qualquer instante a cor original oficial do emissor.
- **Fidelidade Visual no Dashboard**:
  - Barras de progresso da fatura e indicadores visuais em `CreditTab.tsx` e `OverviewTab.tsx` agora refletem 100% a cor customizada do cartão.

## [1.1.50] - 2026-09-09

### 🔄 Sincronização em Tempo Real via SSE & Estabilidade da Esteira de Build
- **Sincronização Push em Tempo Real via Server-Sent Events (SSE)**:
  - Implementação de canal de eventos em tempo real (`/api/sync/events`) na API Node.js com heartbeat periódico e reconexão resiliente.
  - O aplicativo Web e Mobile Android recebem avisos imediatos de alterações remotas, sincronizando novos dados sem depender exclusivamente de polling.
- **Reconciliação e Blindagem de Cartões de Crédito**:
  - Correção na lógica de reconciliação para evitar deleção acidental de cartões durante o ciclo de heartbeat/sync.
  - Correção no reset do formulário do modal de cartões (`CardModal.tsx`), preservando os valores inseridos pelo usuário.
- **Esteira de Compilação de APK Android**:
  - Sincronização de manifests e liberação de release com bump oficial para v1.1.50.

## [1.1.49] - 2026-09-09

### 💳 Novos Emissores e Logotipos Oficiais de Cartões em Alta Definição (HD)
- **7 novos cartões oficiais suportados com vetores HD dedicados**:
  - **Cartão Amazon**: acabamento grafite escuro com a clássica marca branca e a seta-sorriso em âmbar (`#ff9900`).
  - **Bradescard**: vermelho oficial Bradesco com os arcos estilizados e tipografia nítida.
  - **Casas Bahia Card**: azul royal com o monograma icônico "CB" (C branco, B carmim `#e71a3b`) e subtexto da marca.
  - **Cartão Americanas**: vermelho vibrante com faixas paralelas horizontais e texto em destaque.
  - **Santander Way**: vermelho Santander com o símbolo da chama e a marca "way" moderna.
  - **Bradesco Neo**: estilo futurista em azul noite com os arcos Bradesco e "neo" em ciano elétrico brilhante (`#00e5ff`).
  - **Cartão Carrefour**: azul e vermelho com o clássico losango e letra "C" em espaço negativo.
- **Integração e Reconhecimento Inteligente**:
  - Seleção direta na grade de emissores no modal de cartões (`CardModal.tsx`) com preenchimento de nomes, cores e gradientes oficiais.
  - Vínculo automático de logotipos por palavras-chave digitadas e exibição de alta resolução em toda a interface (detalhes, listas, painel e pagamento de fatura).
  - Central de Ajuda atualizada com o FAQ `faq-logos-cartoes`.

## [1.1.48] - 2026-09-09

### 🔒 Persistência Confiável de Cartões e Tema
- **Cartões protegidos contra sincronização parcial**:
  - Uma falha isolada ao consultar qualquer tabela do Supabase invalida o snapshot inteiro; a sincronização não transforma mais erro de leitura em lista vazia.
  - O salvamento geral deixou de interpretar `cards: []` como ordem para apagar todos os cartões. Exclusões continuam acontecendo apenas pelas ações explícitas de excluir ou restaurar os dados.
  - Inclusões, edições e exclusões pendentes de cartões ficam registradas localmente e são reconciliadas com a nuvem, inclusive após reiniciar o app, preservando também o banco/logotipo selecionado.
- **Concorrência e tema estabilizados**:
  - Respostas remotas iniciadas antes de uma alteração local são descartadas, e gravações completas são serializadas para o snapshot mais novo sempre vencer.
  - Falhas transitórias ao enviar o store para a API entram novamente na fila, sem descartar silenciosamente a última alteração.
  - Preferências visuais locais deixam de ser substituídas pelo heartbeat; no modo demonstração, o perfil passa a ser persistido corretamente antes da próxima abertura.

### 📐 Dashboard Responsivo e Encaixe Inteligente
- **Cards sem lacunas artificiais**:
  - A grade modular mede a altura real de cada card e encaixa os próximos indicadores no espaço livre, eliminando grandes áreas vazias entre widgets de tamanhos diferentes.
  - Cards expandidos continuam ocupando toda a largura, enquanto os demais preservam a reorganização e o redimensionamento já salvos pelo usuário.
- **Adaptação pela largura útil**:
  - A mudança entre uma e duas colunas passa a considerar o espaço interno disponível após a barra lateral, inclusive quando o menu é recolhido ou expandido.
  - Tablets e janelas intermediárias permanecem em uma coluna legível, sem cortes ou compressão indevida de gráficos e textos.
- **Central de Ajuda**:
  - Novo guia e FAQ explicam como mostrar, ocultar, reordenar, expandir e restaurar os cards do dashboard.

## [1.1.47] - 2026-09-08

### 🏷️ Preflight de Deploy Compatível com Tags Históricas
- **Busca Direcionada da Tag Atual**:
  - O deploy deixa de importar todas as tags remotas e busca somente a tag correspondente à versão em publicação.
  - Tags antigas divergentes no clone local não bloqueiam mais uma implantação válida da versão atual.
- **Falha Segura Preservada**:
  - Se a tag atual não existir ou não apontar para o mesmo commit de `main`, o processo continua sendo interrompido antes de acessar a VPS.

## [1.1.46] - 2026-09-08

### 🧱 Barreiras Preventivas para Publicações Web, Android e VPS
- **Validação Interna do APK**:
  - O GitHub Actions inspeciona `versionName`, `versionCode` e o manifesto `app-version.json` embarcado antes de criar a release.
  - Qualquer divergência interrompe a publicação e impede que um APK inconsistente chegue aos usuários.
- **Deploy Protegido e Verificável**:
  - O deploy exige worktree limpo, commit sincronizado com `origin/main`, fontes de versão consistentes e APK oficial já publicado.
  - Após recriar o contêiner, o script compara automaticamente a versão da API com a versão do bundle servido pela VPS.
- **Manifesto Gerado no Build**:
  - O Vite gera `app-version.json` diretamente do `package.json`, e todo build falha se o artefato não carregar a versão esperada.
  - O histórico de releases passa a permitir somente uma entrada dinâmica, evitando que versões antigas mudem acidentalmente.

## [1.1.45] - 2026-09-08

### 🔄 Sincronização Única de Versão no Web, Android, VPS e GitHub
- **Fonte Única de Verdade**:
  - `package.json` passa a alimentar diretamente a versão exibida no aplicativo, o manifesto Android, a API da VPS e o workflow de release.
  - Corrigida a divergência em que o APK era `1.1.44`, a interface mostrava `1.1.40` e o servidor anunciava `1.1.41`.
- **Atualização Android Confiável**:
  - `versionCode` agora é derivado da versão semântica, mantendo ordem crescente tanto em builds locais quanto no GitHub Actions.
  - O pipeline valida todas as fontes antes da compilação e bloqueia a sobrescrita de uma tag existente por outro commit.
- **Metadados de Produção Seguros**:
  - As notas de versão foram separadas dos dados mutáveis de usuários, permitindo atualização no deploy sem risco para as stores da VPS.

## [1.1.44] - 2026-09-08

### 🛡️ Triggers no PostgreSQL e Bloqueio Definitivo contra Ressurreição de Dados
- **Gatilhos no Banco de Dados Supabase (PostgreSQL Triggers)**:
  - Implementação de triggers ativos (`trg_prevent_ghost_transactions` e `trg_prevent_ghost_cards`) com execução `BEFORE INSERT OR UPDATE` nas tabelas `transactions` e `credit_cards`.
  - Qualquer tentativa de clientes antigos com bundles em cache de inserir ou atualizar transações ou cartões legados (anteriores a setembro de 2026) é interceptada e descartada silenciosamente (`RETURN NULL`) a nível de banco de dados.
- **Sincronização Bidirecional & Exclusão Real no Supabase (`supabaseDb.ts`)**:
  - `saveEntireStore` agora reconcilia deleções: quando a lista de transações for limpa ou esvaziada pelo usuário, ela executa a limpeza real no banco de dados (`DELETE FROM transactions WHERE user_id = targetUserId`).
  - Adição dos métodos dedicados `deleteTransaction` e `deleteMultipleTransactions` com chamada direta ao Supabase via `FinancialContext.tsx` no momento exato em que o usuário clica em excluir.
- **Sanitização Server-Side no Backend Express (`apiServer.js`)**:
  - Implementação do filtro `sanitizeStoreData` em `GET /api/user/store` e `POST /api/user/store`, impedindo que stores no disco do servidor VPS recebam ou sirvam dados legados.
- **Proteção do Ciclo de Deploy (`deploy-vps.ps1`)**:
  - Exclusão estrita de `server/data/stores` e `server/data/*.json` no empacotamento e extração do deploy na VPS Oracle.

## [1.1.43] - 2026-09-08

### 🛡️ Blindagem contra Ressurreição de Dados Antigos & Proteção de Deploy
- **Isolamento de Dados no Deploy (`deploy-vps.ps1` & `.gitignore`)**:
  - O script de deploy em produção agora ignora explicitamente qualquer arquivo de dados local (`--exclude="server/data/stores"` e `--exclude="server/data/*.json"`). O deploy de código nunca mais sobrescreve os dados em execução no servidor VPS.
  - Arquivos de store pessoal (`usr-default-liverton.json`, `*.json`) foram permanentemente removidos do rastreamento do Git e protegidos via `.gitignore`.
- **Fonte Canônica de Verdade no Supabase (`FinancialContext.tsx`)**:
  - Correção na sincronização (`pullData` e `refreshData`): se o usuário limpou transações ou excluiu cartões no Supabase, essa limpeza é autoritativa.
  - Eliminado o comportamento falho que ressuscitava transações e cartões antigos de arquivos em disco quando a contagem de lançamentos no Supabase era zero.
  - Sincronização unidirecional do Supabase para o store do servidor Express (`apiSync.pushStore`), garantindo que o servidor acompanhe as exclusões do usuário.
- **Higienização Completa Imediata**:
  - Limpeza dos 19 lançamentos residuais e dos 3 cartões antigos de teste no Supabase e no container Docker da VPS.
  - Preservação intacta dos 2 cartões atuais do usuário (`C.C NUBANK` e `C.C INTER`).

## [1.1.42] - 2026-09-08

### 💳 Ícones Oficiais de Bancos nos Cartões & Tema Dinâmico Personalizado
- **Identidade do Emissor com Ícones de Bancos Brasileiros (`bankLogos.tsx`)**:
  - Os cards de crédito agora exibem com destaque o logotipo oficial do banco ou instituição emissora (Nubank, Inter, Itaú, Bradesco, Banco do Brasil, Santander, Caixa, C6 Bank, BTG Pactual, XP, Mercado Pago, PicPay, etc.) no lugar do ícone da bandeira.
  - O utilitário `getCardBankInfo` identifica inteligentemente a instituição emissora pelo `bankId`, nome do cartão ou palavras-chave conhecidas com retrocompatibilidade total.
  - A bandeira do cartão (Mastercard, Visa, Elo, Amex, etc.) permanece acessível através de um badge elegante e minimalista posicionado junto ao título do cartão.
- **Tema Dinâmico e Personalizado no Card (`CreditTab.tsx`, `OverviewTab.tsx`, `CardModal.tsx`)**:
  - Ao selecionar o banco ou escolher uma cor personalizada no modal de cartão, o tema visual do card é ativado em toda a aplicação.
  - Aplicação de gradientes radiais suaves (`radial-gradient`) com iluminação temática personalizada no fundo do card tanto no tema escuro quanto no claro.
  - Barra de progresso de limite/fatura e botões de atalho ("Ver Fatura") sincronizados com a cor do cartão.
  - Seletor de cores no `CardModal` turbinado com atalhos de paletas oficiais de bancos para aplicação em 1 clique.
  - Atualização integrada nos cards da Visão Geral (`OverviewTab.tsx`), Lista de Cadastros (`CadastrosPage.tsx`) e modais de liquidação de fatura (`PayInvoiceModal.tsx`).

## [1.1.41] - 2026-09-08

### 💳 Estabilidade de Cadastro de Cartões & Sincronização Híbrida Web/Android
- **Digitação Estável no Formulário de Cartão (`CardModal.tsx`)**:
  - Eliminação completa do reset involuntário dos campos de texto (Nome do Cartão, Limite, Dia de Fechamento e Dia de Vencimento) enquanto o usuário digitava.
  - O estado do formulário agora inicializa estritamente na abertura do modal (`isOpen && !prevIsOpenRef.current`), desacoplado das revalidações de rede em segundo plano e do foco de janela (`window.focus`).
  - Correção na comparação de cartões em edição (`prevEditingCardIdRef`) que antes tratava falsamente qualquer cartão novo como uma troca permanente de cartão.
  - Higienização numérica rigorosa no salvamento para limites (`replace(/\./g, '').replace(',', '.')`) e limitação segura de dias entre 1 e 31.
- **Bloqueio de Alertas de Fatura Prematuros (`notificationEngine.ts`)**:
  - Correção na regra de agendamento de notificações de cartão de crédito: o alerta de vencimento agora exige obrigatoriamente que haja fatura aberta com valor maior que zero (`invoiceTotal > 0 && !isPaid`).
  - Cartões recém-cadastrados ou sem compras registradas no mês nunca mais disparam notificações indevidas informando que a fatura vence em x dias.
- **Sincronização Híbrida em Tempo Real entre Web e App Android (`FinancialContext.tsx` & `apiSync.ts`)**:
  - Resolução definitiva do problema onde cartões cadastrados no aplicativo não apareciam ao acessar pelo navegador.
  - Conciliação bidirecional inteligente (`pullData` e `refreshData`): os dados agora são unificados mesclando tanto o Supabase PostgreSQL quanto a store do servidor Express (`usr-default-liverton.json`), garantindo que nenhuma fonte sobrescreva a outra com lista vazia.
  - Persistência síncrona imediata no `localStorage` ao chamar `addCard`, `updateCard` e `deleteCard`.
- **Compatibilidade de Identificadores UUID no Supabase (`supabaseDb.ts`)**:
  - Implementação de resolvedor canônico `getValidUserId` que traduz identificadores locais (`usr-default-liverton`, `usr-demo-financeiro` e e-mails) para os UUIDs correspondentes exigidos pela chave estrangeira `auth.users(id)` no PostgreSQL, eliminando o erro 400 (`22P02 - invalid input syntax for type uuid`).
- **Autenticação Dual no Backend (`apiServer.js`)**:
  - O middleware de autenticação do servidor agora valida tokens de sessão Finly (HMAC-SHA256) e tokens JWT do Supabase Auth de forma transparente.
  - Resolução de rotas de dados (`getUserStorePath`) com mapeamento canônico para usuários e aliases, eliminando falhas de BOLA/IDOR e garantindo o mesmo repositório persistente para todas as plataformas.

## [1.1.40] - 2026-09-08

### 🚀 Restrição de Modais e Notificações de APK ao App Android Nativo
- **Isolamento de Atualizações APK vs. Atualização Silenciosa Web**:
  - Correção definitiva do comportamento na Web onde uma janela modal surgia oferecendo download de arquivo `.apk` compilado para Android.
  - A checagem proativa em segundo plano de novas compilações (`runAutoCheck`) agora possui guarda estrita (`isNativeCapacitor()`), não disparando checagens nem abrindo modais em navegadores desktop ou móveis.
  - O componente `UpdateNoticeCard` (banner de topo) e `AppUpdateModal` contam com verificação antecipada de runtime nativo: em navegadores comuns, retornam nulo imediatamente, eliminando listeners e temporizadores ociosos.
- **Roteamento Inteligente de Notificações e Toasts**:
  - No cabeçalho (`Header.tsx`), o clique em notificações sobre novas versões na Web redireciona o usuário para a aba "Sobre o Finly" com as notas de lançamento detalhadas, sem acionar modais de download de APK.
  - No toast de notificação interna (`InAppNotificationToast.tsx`), o evento é roteado contextualmente respeitando a plataforma do usuário.
- **Sincronização da Base de Suporte & Central de Ajuda (`helpCenterData.ts`)**:
  - Atualização da pergunta frequente (`faq-atualizacao-android`) esclarecendo que na Web as atualizações ocorrem de forma 100% automática e contínua pelo servidor, enquanto no Android o APK pode ser baixado e instalado via aba Mais -> Sobre o Finly.

## [1.1.39] - 2026-09-08

### 🛡️ Atomicidade da Limpeza de Dados & Sincronização em 3 Camadas
- **Limpeza Completa em 3 Camadas Persistentes (Local, Banco e Servidor)**:
  - Implementação da exclusão coordenada de dados financeiros em:
    1. **LocalStorage / Cache do Navegador**: Limpeza cirúrgica das chaves locais com inicialização atômica da conta padrão.
    2. **Banco de Dados Supabase**: Exclusão sequencial relacional no cliente e bypass administrativo via `supabaseAdmin` no servidor (8 tabelas: transações, cartões de crédito, orçamentos, metas, dívidas, investimentos, notificações e contas).
    3. **Servidor VPS (Oracle Cloud)**: Criação do endpoint `DELETE /api/user/store` com reescrita atômica em disco (`stores/{userId}.json`), garantindo que os dados remotos não voltem a ser servidos.
- **Trava Anti-Reversão de Sincronização (`isResettingRef`)**:
  - Prevenção definitiva de *race conditions*: o polling em segundo plano (`pullData` a cada 20 segundos) e a revalidação por foco de janela (`refreshData`) são bloqueados durante e imediatamente após a limpeza.
  - Elimina o problema onde os dados sumiam momentaneamente da tela e reapareciam logo em seguida ao serem repuxados da nuvem.
- **Distinção Clara na Interface de Configurações (`SettingsPage.tsx`)**:
  - Renomeação da ação para **"Limpar Dados Financeiros"** com descrição objetiva: *"Apaga transações, metas, dívidas e orçamentos para recomeçar do zero"*, separando-a de "Limpar Cache" da aplicação.
  - Feedback visual aprimorado com indicador de progresso (spinner) no botão de confirmação e toast de sucesso verde.
- **Exportação e Backup de Segurança**:
  - Implementação do método `exportBackupJSON` exportando o estado financeiro consolidado antes de qualquer operação destrutiva.
- **Documentação e Central de Ajuda (`helpCenterData.ts`)**:
  - Nova pergunta frequente adicionada (`faq-limpar-dados-recomecar`) detalhando passo a passo a diferença entre limpeza de cache do navegador e redefinição total dos dados financeiros para recomeçar do zero.

## [1.1.38] - 2026-09-08

### 🔒 Persistência de Recuperação, Intercompatibilidade & Blindagem de E-mail
- **Persistência em Disco de Códigos de Verificação (`verificationCodes.json`)**:
  - Os códigos de recuperação agora são salvos de forma atômica no diretório persistente montado no Docker (`/app/server/data`).
  - Reinicializações do container ou novos deploys na VPS não apagam mais os códigos solicitados pelos usuários.
- **Intercompatibilidade Hotmail & Gmail para a Conta Principal**:
  - O e-mail `liverton.aguiar.sup@gmail.com` foi vinculado como alias oficial da conta `usr-default-liverton` (`liverton.aguiar@hotmail.com`).
  - O login e a recuperação de senha agora aceitam tanto o Hotmail quanto o Gmail do remetente, direcionando sempre para a conta e store financeiro reais do usuário.
- **Bloqueio de E-mails Fantasmas & Prevenção de Bounces**:
  - A rota `/api/send-recovery-code` agora valida previamente se o e-mail solicitado existe em `users.json`. E-mails inexistentes retornam 404 claro, impedindo disparos para endereços inválidos que causavam avisos de erro de entrega (*Mail Delivery Subsystem*).
- **Tolerância a Códigos de 5 e 6 Dígitos**:
  - Aceitação de códigos onde o primeiro ou último dígito pudesse ter sido omitido por espaço ou colagem rápida em teclados móveis.
- **Auditoria e Logs Transparentes no Servidor**:
  - Middleware de logging adicionado para registrar requisições de autenticação e recuperação no Docker com ofuscação de senhas para facilitar diagnóstico.

## [1.1.37] - 2026-09-08

### 🔒 Segurança, Autenticação & Recuperação de Senha
- **Recuperação de Senha Aprimorada & Tolerância a Múltiplos Códigos**:
  - Correção do erro *"Tentativa 1 de 5"* ao inserir o token de 6 dígitos recebido por e-mail.
  - Suporte inteligente a múltiplos envios de código na janela de 15 minutos: se o usuário clicar mais de uma vez para recuperar senha, qualquer código ativo gerado dentro do prazo é validado com sucesso.
  - Higienização automática de espaços, pontuações e hífens (`replace(/\D/g, '')`) ao colar ou digitar o código.
  - Remoção de truncamento acidental por `maxLength` no navegador antes da limpeza de caracteres.
  - Adicionado atalho de **"Reenviar código"** diretamente na tela de verificação sem precisar reiniciar o processo.
  - Auto-login imediato e redirecionamento para o painel após a redefinição bem-sucedida de senha.
- **Login Resiliente & Sincronização Supabase**:
  - Fallback automático e transparente: falhas de autenticação no Supabase (como senhas divergentes ou ausência de cadastro) agora caem diretamente para verificação na API Finly, impedindo que o usuário fique bloqueado na tela de login.
  - Sincronização bidirecional via Supabase Admin SDK: redefinições e alterações de senha no servidor Finly atualizam instantaneamente o Supabase Auth em segundo plano.
- **Identidade Visual & Menu Meu Perfil**:
  - Remoção da leve transparência no menu Meu Perfil: agora renderizado com fundo 100% sólido (`bg-[#18181b] border-[#27272a]` no modo escuro e `bg-white border-slate-200` no modo claro).
  - Padronização do botão de envio na recuperação de senha com o gradiente oficial Finly (`from-purple-600 to-indigo-600`).

## [1.1.34] - 2026-09-07

### ✨ Novidades & Funcionalidades
- **Histórico Permanente de Notificações com Limpeza Manual**:
  - Todas as notificações do sistema (faturas a vencer, contas a pagar, limites orçamentários de 80% e 100%, metas concluídas e atualizações) agora são gravadas no histórico permanente e sincronizadas entre sessões.
  - As notificações não somem sozinhas: saem apenas quando o usuário acionar o botão **"Limpar tudo"** ou a **lixeira individual** de cada alerta.
  - Abas de filtragem rápida entre `Todas` e `Não lidas`, botão de marcar todas como lidas e atalho direto na aba Mais do app mobile.
- **Som da Notificação Interna no Celular (Android)**:
  - O áudio harmônico oficial (`finly_chime.wav` - acorde C6 + E6) foi configurado no canal nativo do Android (`finly-alerts-v2`), garantindo toque no alto-falante do celular com aparelho bloqueado e na barra de notificações.
- **Donut Chart de Categorias Moderno & Responsivo**:
  - Gráfico reformulado com bordas arredondadas orgânicas (`cornerRadius={6}`), expansão fluida (`Sector`) e hub central interativo revelando valores e percentuais ao toque ou hover.
  - Abas segmentadas `[ Todas | Fixas | Variáveis ]` recalculando fatias em tempo real e pílulas de macro divisão.
- **Padronização de Datas Brasileiras**:
  - Formato estritamente brasileiro: `DD/MM` (metadados compactos e linhas de extrato) e `DD/MM/AAAA` (cabeçalhos de grupos, detalhes e seletores de data).
- **Tutorial Mobile Sincronizado**:
  - Central de ajuda e telas do mockup Android corrigidas indicando o acesso ao módulo Planejamento através do menu Mais (5º ícone) na barra de navegação móvel.

## [1.1.33] - 2026-09-07

### ✨ Novidades & Usabilidade
- **Status Unificado de Compras no Cartão (`Pendente (Cartão)`)**:
  - Compras no cartão de crédito agora exibem o rótulo intuitivo **`Pendente (Cartão)`** com o ícone de cartão de crédito e **`Pago (Cartão)`** com check verde, eliminando o termo confuso *"Fatura Aberta"* da linha de despesas.
- **Botão de Download de APK Permanente**:
  - O botão de download do pacote APK do Android agora fica sempre visível e acessível em todas as telas (Web e Android) no menu Mais Opções e na Central de Atualizações, permitindo baixar o instalador a qualquer momento sem restrições.

## [1.1.32] - 2026-09-07

### ✨ Novas Funcionalidades & Experiência Móvel
- **Reordenação Touch & Pointer no Menu Lateral**:
  - Manipulação nativa por toque (`onTouchStart`, `onTouchMove`, `onTouchEnd`) e ponteiro (`setPointerCapture`) na personalização do menu lateral.
  - Área touch confortável para dedos, destaque visual no cartão arrastado, feedback háptico com vibração suave e auto-scroll ao aproximar das bordas.
- **Download e Compartilhamento Nativo no Android**:
  - Exportação oficial de relatórios em PDF, planilhas Excel (.xlsx) e CSV diretamente no aplicativo Android utilizando o Capacitor Filesystem e Share API nativa.
- **Navegação Inteligente no Dia Atual**:
  - Ao entrar na aba de Transações, o aplicativo foca e centraliza automaticamente a visualização nas transações da data de hoje.

### ⚡ Melhorias & Correções
- **Modo Privacidade Unificado**:
  - Remoção de opções redundantes em Configurações e Mais Opções, centralizando o controle no ícone de olho no cabeçalho superior.
- **Estabilidade de Gestos no Mobile**:
  - Correção de deslocamento horizontal indesejado na aba de cartões em telas estreitas de smartphones.
  - Fechamento imediato do popover de notificações ao clicar ou tocar em qualquer ponto fora do modal.

## [1.1.31] - 2026-09-07

### ✨ Novas Funcionalidades & Segurança
- **Suporte Nativo a Biometria (Digital) no App Android**:
  - Implementação do plugin nativo `FinlyBiometricPlugin` utilizando `androidx.biometric:biometric:1.2.0-alpha05` (`BiometricPrompt` e `BiometricManager`).
  - Desbloqueio instantâneo do app via sensor de impressão digital (TouchID/FaceID) ao abrir o app ou ao tocar no botão de digital da tela de bloqueio PIN.
  - Permissões `USE_BIOMETRIC` e `USE_FINGERPRINT` adicionadas no `AndroidManifest.xml`.
  - Diagnóstico em tempo real de hardware biométrico e impressões digitais cadastradas no aparelho.
- **Validação de Biometria ao Ativar**:
  - Solicitação imediata de toque no sensor ao ativar o toggle de biometria nas configurações para certificar o funcionamento antes de salvar.
- **Menu Mais Opções Simplificado**:
  - Restringido estritamente para as 3 abas essenciais: **Geral**, **Segurança** e **Sobre**.

## [1.1.30] - 2026-09-07

### ✨ Novas Funcionalidades & UI/UX
- **Novo Sistema de Design Oficial Sleek Neo-Glass Prism**:
  - Nova identidade visual baseada no Sleek Design (`sleek.design`) com fundo escuro profundo (`#080B14`), cartões em vidro translúcido acrílico (*frosted glassmorphism*), iluminação ambiente de malha violeta/ciano e cor de destaque Ciano Neon (`#06B6D4`).
- **5 Novos Presets de Aparência Selecionáveis em Configurações**:
  - `Sleek Obsidian` (Preto nobre `#07080A` com Âmbar Elétrico).
  - `Sleek Neo-Glass` (Vidro translúcido acrílico com Ciano Neon).
  - `Tech Green Terminal` (Preto fosco carbono `#0A0D0C` com Verde Esmeralda Neon).
  - `Swiss Luxury` (Azul marinho nobre `#071026` com Ouro Champanhe fosco).
  - `Linear Mono` (Preto absoluto OLED com alto contraste puro).
- **Geometria de Bordas Sleek Squircle (36px)**:
  - Curvatura ultra-orgânica nos cartões e modais, complementando os estilos arredondado (25px), moderno (16px) e reto (8px).
- **Novas Cores de Destaque**:
  - Âmbar Sleek (`#FF8A00`), Ciano Neon (`#06B6D4`), Verde Tech (`#00FF88`), Ouro Champanhe (`#D4AF37`).

### ⚡ Melhorias & Correções
- **Exportação de Relatórios PDF com Gráficos e Visuais**:
  - Incorporação de gráficos visuais executivos, métricas consolidadas e formatação profissional nos relatórios gerados.

---

## [1.1.29] - 2026-09-07

### ✨ Novas Funcionalidades & UI/UX
- **Nova NavBar Ultra-Compacta & Responsiva (Micro Pílula Fina - 44px)**:
  - Altura reduzida para 44px com largura auto-contida em cápsula de 310px centralizada.
  - Libera mais de 90% da tela útil para gráficos, faturas e extratos, sem qualquer sobreposição de dados.
  - 4 abas de navegação (Início, Transações, Cartões, Mais) com ícones lineares puros e micro-ponto de luz sob a aba selecionada.
  - Botão de ação central `+` circular de 32px integrado com rotação suave em `X` para o menu Speed Dial.
  - Total compatibilidade com safe-area insets (`env(safe-area-inset-bottom)`).
- **Ícone Oficial do Finly nas Notificações Android**:
  - Vetores monocromáticos com transparência (`ic_stat_finly_notification.xml` e `ic_stat_finly.xml`) em conformidade com as diretrizes do Android 5.0+.
  - Resoluções de alta densidade geradas para mdpi, hdpi, xhdpi, xxhdpi e xxxhdpi.
  - Accent color oficial configurada (`#7C4DFF`).

### ⚡ Melhorias & Correções
- **Contraste & Contorno dos Cards no Modo Claro (WEB)**:
  - Fundo do modo claro elevado para `#F1F5F9`, criando 52 níveis de contraste contra os cartões brancos `#FFFFFF`.
  - Contornos destacados em tom Slate-300 (`#CBD5E1`) no tema claro.
- **Badge de Status da Fatura do Cartão de Crédito**:
  - Formatação arredondada em pílula (`rounded-full`), prevenção de quebra de linha (`whitespace-nowrap`) e truncamento inteligente no título do cartão.

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
