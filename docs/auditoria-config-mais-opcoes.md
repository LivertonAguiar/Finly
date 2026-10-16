# Relatório de Auditoria — Configurações, "Mais opções" e Sistema (Finly)

> **Status:** Concluído (Fase 0 — Somente Leitura)  
> **Data:** 15 de Outubro de 2026  
> **Versão do Finly Auditada:** v1.1.79  
> **Documento Base:** `PLANO_IMPLEMENTACAO_FINLY.md`

---

## 1. Tabela Consolidada de Auditoria

| ID | Hipótese | Evidência no Código (`arquivo:linha`) | Decisão (Regra 0.1) | Esforço | Risco | Observações e Diagnóstico Técnico Real |
|:---|:---|:---|:---:|:---:|:---:|:---|
| **C-01** | Duplicação de segurança (PIN, biometria e senha) em Settings e Profile. | `SettingsPage.tsx:177-220` e `ProfilePage.tsx:63-145` | `IMPLEMENTAR` | M | Baixo | **Confirmado:** Ambos os arquivos importam o `securityManager` e duplicam estados, toggles de biometria e handlers de PIN. A recomendação é unificar em um subcomponente compartilhado `SecuritySettingsSection` ou manter Perfil como tela canônica e Settings com atalho direto. |
| **C-02** | Navegação da tela em abas sugerida no i18n/README, mas layout é página única de 2 colunas. | `SettingsPage.tsx:466` e `README.md:140` | `IMPLEMENTAR` | M | Médio | **Confirmado:** O arquivo tem 1.509 linhas e renderiza uma grade rígida de 2 colunas sem abas, âncoras ou busca, apesar de existirem chaves `settings.tab.*` no `i18n.ts`. |
| **C-03** | Modelo de salvamento misto (botão global vs autosave) e persistência de widgets desconectada. | `SettingsPage.tsx:308-311` vs `OverviewTab.tsx:144` | `IMPLEMENTAR` | M | Baixo | **Descoberta Crítica:** A `SettingsPage` salva `finly_dash_widgets`, enquanto o `OverviewTab` utiliza `finly_dashboard_cards_v5`. Os checkboxes de widgets em Configurações são legados e não afetam o dashboard real! Salvar idioma e tema já é instantâneo; formulários cadastrais devem manter botão explícito. |
| **C-04** | Modo Privacidade (ocultar saldos com `••••••`) existe no i18n mas falta na UI de Settings. | `SettingsPage.tsx` vs `FinancialContext.tsx:1725` | `IMPLEMENTAR` | P | Mínimo | **Confirmado:** O recurso já existe globalmente (`user.showValues`, `toggleHideValues` no Header e Dashboard), mas a tela de Configurações não possui o toggle correspondente, apesar das chaves `settings.privacy.*`. |
| **C-05** | Notificações com propriedades em `NotificationPreferences` sem controles visuais na UI. | `notificationEngine.ts:123-134` vs `SettingsPage.tsx:750-834` | `IMPLEMENTAR` | P | Mínimo | **Confirmado:** O motor possui `goalsProgress`, `dailyDigest` e `notifyTime` (horário do lembrete), mas a interface de Settings só expõe faturas, contas, 80%, 100% e som. |
| **C-06** | Strings fixas em pt-BR sem i18n em Settings e More. | `SettingsPage.tsx:750-834` e `MorePage.tsx:201` | `IMPLEMENTAR` | M | Baixo | **Confirmado:** Mais de 60 strings de títulos, legendas e descrições estão hardcoded em português sem uso de `t()`. |
| **C-07** | Acessibilidade com divs clicáveis, checkboxes de 16px e textos reduzidos (10–11px). | `SettingsPage.tsx:573`, `884-889` | `IMPLEMENTAR` | M | Baixo | **Confirmado:** Cards de tema utilizam `<div onClick>` sem `role="radio"` ou teclado. Checkboxes têm `w-4 h-4` (16px), abaixo do target WCAG de 44px. Textos em `text-[10px]` abundantes. |
| **C-08** | Temas: apenas um preset claro, ausência de 'seguir sistema' e divergência no README. | `themeEngine.ts:1-106` vs `README.md:168` | `IMPLEMENTAR` | M | Baixo | **Confirmado:** Existem 10 presets no código (9 escuros e 1 claro). Não há `prefers-color-scheme` ('automático/sistema'). O README cita apenas 5 presets desatualizados. |
| **C-09** | Persistência exclusiva em `localStorage` para preferências de UI e segurança. | `securityManager.ts:8-13` e `notificationEngine.ts:149` | `ADAPTAR` | G | Médio | **Confirmado:** PIN, preferências de notificação e widgets ficam em `localStorage`. A migração para nuvem/Supabase deve ser opcional e com fallback seguro sem quebrar o modo offline/local. |
| **C-10** | Zona de perigo: 'Limpar Dados' sem confirmação forte e sem proteção para conta Demo. | `SettingsPage.tsx:1307-1321`, `FinancialContext.tsx:3273` | `IMPLEMENTAR` | P | Baixo | **Descoberta Crítica de Segurança:** `resetAllUserData` não valida `isDemoUser()` e chama o endpoint de reset no Supabase/servidor, permitindo que um visitante da Demo apague os dados da nuvem para todos. Além disso, falta confirmação por digitação ("LIMPAR") e oferta de backup prévio. |
| **C-11** | Configurações ausentes (formato de data, início do mês financeiro, LGPD). | `formatters.ts:32`, `FinancialContext.tsx:3395` | `IMPLEMENTAR` | P | Baixo | **Confirmado:** Início do mês é fixo no dia 1 civil. Falta atalho direto nas Configurações para exportação completa de registros (LGPD). |
| **M-01** | Aba Geral dinâmica em `MorePage` oculta itens se já estiverem ativos na sidebar. | `MorePage.tsx:208` | `IMPLEMENTAR` | P | Baixo | **Confirmado:** `visibleGeneralItems = generalMoreItems.filter(...)` oculta módulos ativos na barra lateral. No mobile, onde a barra lateral fica oculta, o usuário pode perder o acesso fácil a itens essenciais. |
| **M-02** | Central de Ajuda 'escondida' dentro de acordeão na subaba Sobre. | `MorePage.tsx:521-535` | `IMPLEMENTAR` | P | Mínimo | **Confirmado:** A Central de Ajuda fica oculta dentro de um acordeão retrátil `isHelpExpanded` na aba Sobre. Deve ser promovida a item de primeiro nível. |
| **M-03** | Lista plana em `MorePage` sem busca ou agrupamento por categorias. | `MorePage.tsx:210-250` vs `sidebarConfig.ts:25-30` | `IMPLEMENTAR` | P | Mínimo | **Confirmado:** Os itens são renderizados em lista sequencial única, sem input de filtro/busca e ignorando o campo `category` já definido em `sidebarConfig.ts`. |
| **M-04** | Falha na verificação de atualização reporta falsamente 'versão mais recente'. | `MorePage.tsx:345-350` | `IMPLEMENTAR` | P | Mínimo | **Confirmado:** O bloco `catch (e)` define `hasUpdate: false` e exibe mensagem de sucesso ("Você já está na versão mais recente"), mascarando falhas de rede ou indisponibilidade da API do GitHub. |
| **M-05** | Botão de 'Baixar APK' só é exibido dentro do app nativo Android (`isNativeCapacitor`). | `MorePage.tsx:362` | `IMPLEMENTAR` | P | Mínimo | **Confirmado:** Quem acessa pelo navegador Web (Desktop ou Chrome Mobile) não vê o botão de baixar o APK nem instruções de PWA, enquanto quem já está no APK vê o botão. A condição está invertida/incompleta. |
| **M-06** | Código morto em `MorePage`: `WebWhatsNewModal` nunca abre e chaves i18n órfãs. | `MorePage.tsx:84, 619` e `i18n.ts:107` | `IMPLEMENTAR` | P | Mínimo | **Confirmado:** `showWebWhatsNewModal` é inicializado como `false` e nunca recebe `true`. A chave `more.tab.manage` existe no i18n mas não é usada no app. |
| **S-01** | Fragilidade criptográfica do PIN (SHA-256 de rodada única, salt estático e sem backoff). | `securityManager.ts:16-27, 62` | `IMPLEMENTAR` | M | Médio | **Confirmado:** O salt é estático (`finly_secure_vault_2026_`) e sem PBKDF2 ou contagem de tentativas. Deve-se migrar para PBKDF2 (WebCrypto) com salt dinâmico por instalação e bloqueio temporário após tentativas incorretas. |
| **S-02** | Política de senha simplificada (apenas `length >= 6`) e ausência de medidor de força. | `AuthContext.tsx:636` | `IMPLEMENTAR` | P | Baixo | **Confirmado:** Validação exige apenas 6 caracteres, sem indicador de força, verificação de caracteres especiais ou opção de mostrar/ocultar senha no formulário. |
| **S-03** | `importBackupJSON` não valida schema/versão nem gera snapshot de segurança antes. | `FinancialContext.tsx:3369-3390` | `IMPLEMENTAR` | M | Médio | **Confirmado:** O método apenas testa `Array.isArray()` nas propriedades. Se o JSON tiver transações malformadas ou campos corrompidos, sobrescreve o estado sem snapshot de reversão prévio e sem exibir contagem antes da confirmação. |
| **S-04** | Notificações push reais (FCM/APNS) vs Local Notifications. | `package.json` e `notificationEngine.ts:1-5` | `ADIAR` | G | Alto | **Diagnóstico Técnico:** O app utiliza `@capacitor/local-notifications` e Notification API web (locais). Push remoto real depende de servidor de push, conta Firebase/APNS e chaves na VPS. Proposto para a Fase 5. |
| **S-05** | Isolamento da conta Demo em operações destrutivas. | `FinancialContext.tsx:3246, 3273` | `IMPLEMENTAR` | P | Baixo | **Confirmado:** Falta blindagem `!isDemoUser()` em `resetAllUserData()`. A conta demo deve apenas recarregar os dados padrões locais (`loadDemoData()`) sem limpar o banco Supabase ou o servidor. |
| **S-06** | Dados de infraestrutura da VPS no repositório (`AGENTS.md`). | `AGENTS.md:6-18` | `PRECISA DE DECISÃO DO USUÁRIO` | P | Alto | **Risco Real:** O arquivo `AGENTS.md` está versionado no repositório `https://github.com/LivertonAguiar/Finly.git` e expõe o IP da VPS, usuário SSH `ubuntu` e chave pública. Recomenda-se mover esses dados para `.env` ou arquivo local no `.gitignore`. Nenhuma alteração de histórico será feita sem autorização. |
| **S-07** | Ausência de UI para regras manuais de categorização automática. | `smartCategorizer.ts` | `ADIAR` | G | Baixo | **Confirmado:** O categorizador usa regras heurísticas estáticas e aprendizado histórico. Uma UI para criar regras manuais pertence à Fase 5 de evolução de produto. |
| **S-08** | Arquivos extensos (`SettingsPage.tsx` 1.5k linhas, `FinancialContext.tsx` 3.5k linhas). | `SettingsPage.tsx` e `FinancialContext.tsx` | `ADAPTAR` | M | Baixo | **Estratégia:** Modularizar `SettingsPage.tsx` em seções menores durante a Fase 4. Manter `FinancialContext.tsx` estável para evitar riscos desnecessários de regressão global. |
| **S-09** | Documentação técnica desatualizada no `README.md`. | `README.md:140, 168-180` | `IMPLEMENTAR` | P | Mínimo | **Confirmado:** Atualizar rotas reais, lista completa dos 10 temas e paletas de cores no `README.md`. |
| **S-10** | Ausência de testes unitários para telas de Configurações, Segurança e Backup. | `tests/` | `IMPLEMENTAR` | M | Baixo | **Confirmado:** Existem 35 suítes de teste de extrato e regras de negócio, mas nenhuma para validação de schema de backup, integridade do PIN e preferências. |

---

## 2. Descobertas Críticas Adicionais (Não previstas no plano original)

1. **Desconexão Total dos Widgets em Configurações (`finly_dash_widgets` vs `finly_dashboard_cards_v5`)**:
   Na `SettingsPage.tsx` (linhas 840–920), há 15 switches de widgets organizados em duas colunas que gravam na chave `finly_dash_widgets`. No entanto, o `OverviewTab.tsx` consome exclusivamente `finly_dashboard_cards_v5` e possui seu próprio modal moderno de personalização (`setIsManageWidgetsOpen`). **O bloco de widgets em Configurações é código legado inútil e desconectado da tela inicial.**
2. **Vulnerabilidade de Reset na Conta Demo (`resetAllUserData`)**:
   Enquanto mutações pontuais em transações respeitam `isDemoUser()`, o método `resetAllUserData()` em `FinancialContext.tsx` (linha 3273) executa `supabaseDb.clearUserStore(currentUser.id)` e `apiSync.resetServerStore(currentUser.id)` sem checar se é demo. Qualquer usuário que clicar em "Limpar Dados" na demo zera os registros no servidor para todos os demais visitantes.
3. **Download de APK Oculto na Web**:
   A condição `{isNativeCapacitor() && ...}` na `MorePage.tsx` (linha 362) esconde o botão de baixar o APK para quem está navegando na Web — exatamente onde o usuário precisa do botão para instalar o aplicativo no celular.

---

## 3. Sugestão de Agrupamento em Releases (Cadência de 4 Mudanças)

Seguindo as diretrizes do `AGENTS.md`, propomos estruturar as entregas nas seguintes etapas sequenciais:

### 🚀 Release 1: Correções Imediatas de UX e Blindagem de Dados (Fase 1 + S-05)
1. **M-04**: Tratamento honesto de erro na verificação de versão (sem mascarar falhas de rede como "versão mais recente").
2. **M-05**: Exibição do botão de download do APK e orientações de PWA para usuários que acessam via navegador Web.
3. **M-06**: Remoção de código morto (`WebWhatsNewModal` não acionado em `MorePage` e chaves i18n órfãs).
4. **S-05 & C-10**: Blindagem estrita da conta Demo em `resetAllUserData` (impedindo que a demo limpe o banco) e sincronização do `README.md` (`S-09`).

### 🔐 Release 2: Segurança Criptográfica & Integridade de Backup (Fase 2 + Fase 3)
1. **S-01**: Criptografia de PIN reforçada com derivação PBKDF2, salt dinâmico por instalação e proteção contra força bruta (bloqueio por tentativas).
2. **S-03**: Validação rigorosa de schema no `importBackupJSON` com criação de snapshot automático prévio para permitir reversão.
3. **C-01**: Unificação da tela canônica de segurança (Perfil) com atalho elegante a partir de Configurações, eliminando código duplicado.
4. **S-02**: Medidor de força de senha, visualização segura (mostrar/ocultar senha) e confirmação forte por digitação ("LIMPAR") na zona de perigo.

### 🎨 Release 3: Reorganização de Configurações e Mais Opções (Fase 4)
1. **C-02 & C-03**: Reorganização de `SettingsPage.tsx` em seções limpas com campo de busca, removendo os switches desconectados de `finly_dash_widgets`.
2. **C-04 & C-05**: Inclusão do toggle de Modo Privacidade em Configurações e controles visuais para `goalsProgress`, `dailyDigest` e `notifyTime`.
3. **M-01 & M-02 & M-03**: Central de Ajuda promovida a card principal em "Mais opções", busca rápida de ferramentas e garantia de acesso a módulos essenciais no mobile.
4. **C-07 & C-08**: Acessibilidade aprimorada (alvos de toque de 44px, botões semânticos nos temas) e opção "Seguir o Sistema" (`prefers-color-scheme`).

---

## 4. Decisões que Dependem da sua Autorização

Antes de prosseguirmos para a Fase 1:

1. **Segurança do Repositório (`S-06`)**:
   Deseja que os dados de infraestrutura (IP da VPS e caminhos de chave SSH) sejam retirados do `AGENTS.md` e transferidos para um arquivo local não versionado (ex: `.env.production` ou `local-infra.md` no `.gitignore`)?
2. **Widgets em Configurações (`C-03`)**:
   Aprova remover a seção legada de 15 switches em `SettingsPage.tsx` e substituí-la por um botão direto que abre o gerenciador oficial e interativo de cards do Dashboard?
3. **Aprovação da Release 1**:
   Podemos iniciar a implementação da **Release 1** (M-04, M-05, M-06, S-05 e S-09)?
