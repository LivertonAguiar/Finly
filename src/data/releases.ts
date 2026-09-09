/**
 * Finly Release Registry & Version History
 * Single Source of Truth for App Versioning, Changelog and In-App Release Notes.
 */
import { version as packageVersion } from '../../package.json';

export type ReleaseType = 'feature' | 'fix' | 'improvement' | 'visual' | 'perf';

export interface ReleaseHighlight {
  title: string;
  description: string;
  type: ReleaseType;
}

export interface GroupedHighlights {
  features: ReleaseHighlight[];
  fixes: ReleaseHighlight[];
  improvements: ReleaseHighlight[];
}

export const groupReleaseHighlights = (highlights: ReleaseHighlight[]): GroupedHighlights => {
  return {
    features: highlights.filter(h => h.type === 'feature'),
    fixes: highlights.filter(h => h.type === 'fix'),
    improvements: highlights.filter(
      h => h.type === 'improvement' || h.type === 'visual' || h.type === 'perf'
    ),
  };
};

export interface ReleaseInfo {
  version: string;
  releaseDate: string;
  summary: string;
  highlights: ReleaseHighlight[];
}

export const CURRENT_VERSION = packageVersion;
export const CURRENT_BUILD_DATE = '2026-09-08';

export const RELEASES: ReleaseInfo[] = [
  {
    version: CURRENT_VERSION,
    releaseDate: '2026-09-08',
    summary: 'Preflight de deploy compatível com repositórios que possuem tags locais antigas, buscando somente a tag da versão publicada.',
    highlights: [
      {
        title: 'Busca Segura da Tag Atual',
        description: 'O deploy consulta somente a tag da versão em publicação e não é afetado por divergências históricas em tags antigas locais.',
        type: 'fix',
      },
      {
        title: 'Bloqueio Antes da VPS',
        description: 'Falhas de preflight continuam interrompendo o processo antes de qualquer arquivo ou serviço de produção ser alterado.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.46',
    releaseDate: '2026-09-08',
    summary: 'Barreiras automáticas validam a versão no bundle, dentro do APK, no GitHub e após o deploy da VPS antes de concluir uma publicação.',
    highlights: [
      {
        title: 'Inspeção Interna do APK',
        description: 'O pipeline confere versionName, versionCode e o manifesto do bundle Web antes de disponibilizar o instalador.',
        type: 'improvement',
      },
      {
        title: 'Deploy com Trava de Consistência',
        description: 'A implantação é bloqueada se o Git não estiver sincronizado, se o APK ainda não existir ou se API e frontend responderem versões diferentes.',
        type: 'improvement',
      },
      {
        title: 'Histórico de Versões Protegido',
        description: 'A validação garante que somente a versão atual seja dinâmica, mantendo todas as versões anteriores imutáveis.',
        type: 'fix',
      },
    ],
  },
  {
    version: '1.1.45',
    releaseDate: '2026-09-08',
    summary: 'Versão do aplicativo, APK e servidor agora sincronizada automaticamente por uma única fonte, com atualização Android confiável.',
    highlights: [
      {
        title: 'Versão Única em Todas as Plataformas',
        description: 'A interface, o manifesto Android, a API da VPS e o release do GitHub passam a derivar a versão oficial do package.json.',
        type: 'fix',
      },
      {
        title: 'Atualizações Android Confiáveis',
        description: 'O aplicativo deixa de exibir versões antigas e de oferecer APKs que já estão instalados no dispositivo.',
        type: 'fix',
      },
      {
        title: 'Proteção no Pipeline de Release',
        description: 'Uma validação automática bloqueia novas compilações quando as fontes divergem ou quando uma versão publicada seria sobrescrita por outro commit.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.40',
    releaseDate: '2026-09-08',
    summary: 'Restrição do modal de atualização e downloads de APK exclusivamente para o aplicativo nativo Android; no acesso Web as atualizações são automáticas sem pop-ups.',
    highlights: [
      {
        title: 'Isolamento de Atualizações APK',
        description: 'Bloqueio de modais e botões de download de instalador APK no acesso via navegador/web, tornando a experiência limpa e silenciosa.',
        type: 'fix',
      },
      {
        title: 'Atualização Transparente na Web',
        description: 'Na Web as atualizações ocorrem automaticamente pelo servidor; notificações no cabeçalho e toasts direcionam para a aba Sobre com as notas de versão.',
        type: 'improvement',
      },
      {
        title: 'Guarda de Plataforma Antecipada',
        description: 'Prevenção em nível de componente nos cards e modais de atualização para garantir que apenas o runtime nativo do Capacitor processe checagens proativas.',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.1.39',
    releaseDate: '2026-09-08',
    summary: 'Limpeza atômica e definitiva de dados financeiros sincronizada entre dispositivo, Supabase (banco de dados) e servidor, com trava anti-reversão de auto-sync.',
    highlights: [
      {
        title: 'Limpeza Definitiva de Dados',
        description: 'Exclusão coordenada de transações, orçamentos, metas e contas no LocalStorage, Supabase e no arquivo do servidor VPS, impedindo o retorno dos dados.',
        type: 'fix',
      },
      {
        title: 'Trava Anti-Reversão de Auto-Sync',
        description: 'Bloqueio do ciclo em segundo plano para não recarregar dados antigos durante e após a execução do reset.',
        type: 'improvement',
      },
      {
        title: 'Feedback Visual de Limpeza',
        description: 'Spinner animado de progresso no modal de exclusão e alerta de confirmação em Configurações -> Dados & Sistema.',
        type: 'visual',
      },
    ],
  },
  {
    version: '1.1.38',
    releaseDate: '2026-09-08',
    summary: 'Persistência permanente em disco dos códigos de recuperação, intercompatibilidade de e-mail (Hotmail/Gmail) e blindagem contra envios inválidos.',
    highlights: [
      {
        title: 'Persistência de Códigos em Disco',
        description: 'Armazenamento dos tokens de recuperação no arquivo verification_codes.json no servidor, garantindo sobrevivência a reinicializações.',
        type: 'fix',
      },
      {
        title: 'Intercompatibilidade Hotmail e Gmail',
        description: 'Vinculação automática de contas para envio confiável via SMTP Gmail oficial.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.37',
    releaseDate: '2026-09-08',
    summary: 'Correção crítica no fluxo de autenticação e recuperação de senha, tolerância a múltiplos códigos com higienização de dígitos, sincronização com Supabase Auth e menu Meu Perfil sólido.',
    highlights: [
      {
        title: 'Recuperação de Senha Aprimorada',
        description: 'Correção do erro "Tentativa 1 de 5" na validação do token: suporte a múltiplos códigos ativos na janela de 15 minutos, sanitização de espaços e formatação ao colar.',
        type: 'fix',
      },
      {
        title: 'Login Resiliente & Sincronização Supabase',
        description: 'Fallback automático e transparente para a API Finly quando credenciais divergem do Supabase, sincronizando senhas em tempo real via Supabase Admin SDK.',
        type: 'fix',
      },
      {
        title: 'Menu Meu Perfil Sólido',
        description: 'Remoção de transparência indesejada no dropdown de perfil nos modos escuro e claro, garantindo opacidade total e contraste ideal.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.36',
    releaseDate: '2026-09-08',
    summary: 'Ajuste visual no gráfico donut no mobile, otimização da aba Sobre com botão de download do APK exclusivo para Android e remoção de recarregamento redundante.',
    highlights: [
      {
        title: 'Gráfico Donut Otimizado no Mobile',
        description: 'Correção de contorno/focus ring indesejado ao tocar nos segmentos do gráfico de despesas por categoria e persistência aprimorada dos dados.',
        type: 'fix',
      },
      {
        title: 'Aba Sobre Otimizada',
        description: 'Botão de download do APK agora é exibido apenas no app Android, mantendo a versão Web mais limpa, e remoção do botão redundante de recarregar.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.35',
    releaseDate: '2026-09-08',
    summary: 'Consolidação de melhorias: histórico permanente de notificações, som nativo Android, donut chart moderno, datas no padrão brasileiro, tutorial mobile atualizado e Central de Ajuda revisada.',
    highlights: [
      {
        title: 'Central de Ajuda Revisada',
        description: 'Conteúdo da Central de Ajuda atualizado com dados de helpdesk e tutoriais mais detalhados.',
        type: 'improvement',
      },
      {
        title: 'Estabilidade e Performance',
        description: 'Ajustes internos de estabilidade, otimização de cache e melhoria de responsividade geral do app.',
        type: 'perf',
      },
    ],
  },
  {
    version: '1.1.34',
    releaseDate: '2026-09-07',
    summary: 'Histórico permanente de notificações com limpeza manual e exclusão individual, som interno do app no celular (Android), donut chart de categorias moderno com hub central interativo, padronização de datas brasileiras e tutorial mobile atualizado.',
    highlights: [
      {
        title: 'Histórico Permanente de Notificações',
        description: 'Notificações de contas a pagar, faturas de cartão e limites orçamentários agora ficam guardadas no histórico até que você decida apagá-las.',
        type: 'feature',
      },
      {
        title: 'Limpeza e Exclusão de Notificações',
        description: 'Opções de Limpar Tudo e lixeira individual em cada notificação, além de abas para filtrar entre Todas e Não Lidas.',
        type: 'feature',
      },
      {
        title: 'Som Interno no Celular (Android)',
        description: 'Áudio harmônico finly_chime.wav integrado ao canal nativo do Android para notificações externas audíveis mesmo com o aparelho bloqueado.',
        type: 'feature',
      },
      {
        title: 'Donut Chart Moderno & Responsivo',
        description: 'Gráfico de categorias com bordas arredondadas, hub central inteligente com toque/hover e filtros rápidos para gastos Fixos e Variáveis.',
        type: 'visual',
      },
      {
        title: 'Padronização de Datas Brasileiras',
        description: 'Formato DD/MM em linhas e metadados compactos e DD/MM/AAAA em cabeçalhos, detalhes e seletores.',
        type: 'improvement',
      },
      {
        title: 'Tutorial Mobile Sincronizado',
        description: 'Central de ajuda e telas de mockup orientando corretamente o acesso a Planejamento através do menu Mais.',
        type: 'fix',
      },
    ],
  },
  {
    version: '1.1.33',
    releaseDate: '2026-09-07',
    summary: 'Status unificado de compras no cartão como Pendente (Cartão) com ícone temático de cartão de crédito, botão permanente de download de APK disponível em todas as plataformas e telas de atualização.',
    highlights: [
      {
        title: 'Status Unificado Pendente (Cartão)',
        description: 'Despesas no cartão agora exibem claramente Pendente (Cartão) e Pago (Cartão) com ícone de cartão de crédito e total alinhamento com os filtros de status.',
        type: 'feature',
      },
      {
        title: 'Botão de Download de APK Permanente',
        description: 'Botão para baixar o pacote APK Android agora permanece sempre visível na Web e no App, permitindo instalar ou atualizar a qualquer momento.',
        type: 'improvement',
      },
      {
        title: 'Reordenação Touch & Pointer no Menu Lateral',
        description: 'Arrastar e soltar itens nativo em telas de toque (celular/tablet) e desktop com captura de ponteiro, resposta háptica imediata e auto-scroll.',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.1.32',
    releaseDate: '2026-09-07',
    summary: 'Reordenação touch e pointer nativa na personalização do menu lateral, exportação e compartilhamento nativo de relatórios no Android (PDF, CSV, XLSX), modo de privacidade centralizado no topo e abertura inteligente de transações no dia atual.',
    highlights: [
      {
        title: 'Reordenação Touch & Pointer no Menu Lateral',
        description: 'Arrastar e soltar itens nativo em telas de toque (celular/tablet) e desktop com captura de ponteiro, resposta háptica imediata e auto-scroll.',
        type: 'feature',
      },
      {
        title: 'Download e Compartilhamento Nativo no Android',
        description: 'Integração completa com o sistema de arquivos e share sheet do Android para exportação direta de relatórios em PDF, planilhas Excel (.xlsx) e CSV.',
        type: 'feature',
      },
      {
        title: 'Navegação Inteligente no Dia Atual',
        description: 'Ao abrir a aba de transações, a visualização posiciona e destaca automaticamente as transações da data de hoje.',
        type: 'improvement',
      },
      {
        title: 'Privacidade e Telas Mais Limpas',
        description: 'Remoção do toggle redundante em Configurações e Mais Opções, unificando o controle de visibilidade no botão de olho permanente do cabeçalho.',
        type: 'improvement',
      },
      {
        title: 'Gestos e Interações Aperfeiçoados',
        description: 'Eliminação de deslocamento lateral na aba de cartões no mobile e fechamento de notificações por toque externo em qualquer dispositivo.',
        type: 'fix',
      },
    ],
  },
  {
    version: '1.1.31',
    releaseDate: '2026-09-07',
    summary: 'Suporte nativo oficial a biometria (impressão digital) no Android via BiometricPrompt, reorganização do menu Mais Opções em Geral, Segurança e Sobre, e diagnóstico inteligente de sensores biométricos.',
    highlights: [
      {
        title: 'Biometria Nativa no App Android',
        description: 'Integração direta com o sensor de impressão digital e biometria do Android (BiometricPrompt), permitindo desbloqueio instantâneo do app.',
        type: 'feature',
      },
      {
        title: 'Menu Mais Opções Simplificado',
        description: 'Estruturação do menu em 3 abas essenciais: Geral, Segurança e Sobre, com todos os módulos complementares centralizados.',
        type: 'improvement',
      },
      {
        title: 'Diagnóstico e Validação de Biometria',
        description: 'Validação ao vivo do sensor ao ativar a biometria e mensagens explicativas caso nenhuma digital esteja cadastrada no aparelho.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.30',
    releaseDate: '2026-09-07',
    summary: 'Novo Sistema de Design Sleek Neo-Glass Prism, presets visuais selecionáveis em Configurações (Sleek Obsidian, Tech Green, Swiss Luxury, Linear Mono), geometria Sleek Squircle 36px e exportação de relatórios em PDF com gráficos.',
    highlights: [
      {
        title: 'Design Sleek Neo-Glass Prism',
        description: 'Nova identidade visual baseada no Sleek Design com fundo escuro profundo, cartões em vidro translúcido acrílico, gradientes de malha e cor de destaque Ciano Neon.',
        type: 'feature',
      },
      {
        title: '5 Novos Presets de Aparência',
        description: 'Seleção em 1 clique com prévia instantânea: Sleek Obsidian, Sleek Neo-Glass, Tech Green Terminal, Swiss Luxury e Linear Mono.',
        type: 'feature',
      },
      {
        title: 'Geometria Sleek Squircle (36px)',
        description: 'Nova opção de curvatura ultra-orgânica nos cards e modais para estética premium moderna.',
        type: 'feature',
      },
      {
        title: 'Relatórios PDF com Gráficos e Visuais',
        description: 'Nova exportação executiva em PDF incorporando métricas visuais, gráficos de pizza e resumos consolidados.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.29',
    releaseDate: '2026-09-07',
    summary: 'Nova barra de navegação ultra-compacta (Micro Pílula 44px), ícone de notificação oficial no Android, contornos aprimorados no modo claro e ajustes no badge de fatura.',
    highlights: [
      {
        title: 'NavBar Ultra-Compacta (Micro Pílula 44px)',
        description: 'Barra de navegação flutuante minimalista de 44px que libera mais de 90% da tela útil para gráficos e extratos com micro-indicador luminoso.',
        type: 'feature',
      },
      {
        title: 'Ícone Oficial nas Notificações Android',
        description: 'Integração do símbolo oficial do Finly como ícone de status nativo monocromático em conformidade com as diretrizes do Android 5.0+.',
        type: 'feature',
      },
      {
        title: 'Contornos & Contraste no Modo Claro (WEB)',
        description: 'Elevação do contraste dos cartões e contornos nítidos em tom Slate-300 no tema claro contra o canvas de fundo.',
        type: 'improvement',
      },
      {
        title: 'Badge de Fatura do Cartão de Crédito',
        description: 'Formatação em pílula arredondada com prevenção de quebra de linha no indicador de fatura paga.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.28',
    releaseDate: '2026-09-07',
    summary: 'Bloqueio biométrico por PIN/digital, exportação para Excel (.xlsx) com múltiplas abas, desafios de economia (52 semanas) e categorização preditiva inteligente.',
    highlights: [
      {
        title: 'Bloqueio Biométrico & PIN Seguro',
        description: 'Proteja a abertura do Finly com código de 4 dígitos criptografado (SHA-256) e biometria (TouchID/FaceID/Digital).',
        type: 'feature',
      },
      {
        title: 'Exportação para Excel (.xlsx) Formatado',
        description: 'Geração nativa de pastas de trabalho em Excel com abas de Resumo Executivo, Lançamentos Detalhados e Contas.',
        type: 'feature',
      },
      {
        title: 'Desafios de Economia (Savings Challenges)',
        description: 'Gamificação para poupar com Desafio das 52 Semanas, Caixa Rápido 30 Dias, Detox Sem Delivery e animações comemorativas.',
        type: 'feature',
      },
      {
        title: 'Categorização Automática com Aprendizado',
        description: 'Reconhecimento preditivo de categorias por histórico e dicionário de estabelecimentos para lançamentos e extratos OFX/CSV.',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.1.27',
    releaseDate: '2026-09-07',
    summary: 'Exportação completa de faturas em CSV/PDF, botão desfazer exclusão de 5s, edição de dívidas, novo layout de configurações em 2 colunas e navegação por gestos no Android.',
    highlights: [
      {
        title: 'Desfazer Exclusão Instantâneo',
        description: 'Notificação flutuante com barra de progresso de 5s para restaurar imediatamente qualquer transação, cartão, conta ou dívida excluída.',
        type: 'feature',
      },
      {
        title: 'Edição de Dívidas & Financiamentos',
        description: 'Modal completo para editar contratos, valores contratados, saldo devedor, parcelas, taxa de juros e próximo vencimento.',
        type: 'feature',
      },
      {
        title: 'Exportação Completa de Faturas em CSV e PDF',
        description: 'Geração de extrato detalhado de lançamentos por cartão com motor Blob UTF-8 BOM e relatório executivo em PDF.',
        type: 'feature',
      },
      {
        title: 'Navegação por Gestos no Android',
        description: 'Suporte a Predictive Back Gestures e histórico LIFO, fechando modais de adição ao fazer o gesto de voltar.',
        type: 'improvement',
      },
      {
        title: 'Configurações em 2 Colunas & UI Otimizada',
        description: 'Separação direta entre Preferências do Sistema e Segurança/Login, além de aba Sobre enxuta com Central de Ajuda expansível.',
        type: 'improvement',
      },
      {
        title: 'Cartões na Barra Inferior Mobile',
        description: 'Substituição do botão Planejamento por Cartões na barra de navegação rápida do aplicativo móvel.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.26',
    releaseDate: '2026-09-06',
    summary: 'Arquitetura Supabase / PostgreSQL com Row Level Security (RLS), persistência híbrida em nuvem e suporte a migração de dados locais.',
    highlights: [
      {
        title: 'Integração Supabase PostgreSQL com RLS',
        description: 'Banco de dados relacional em nuvem com Row Level Security por usuário, preservando modo offline e fallback demo.',
        type: 'feature',
      },
      {
        title: 'Migração Progressiva de Dados Locais',
        description: 'Migração automatizada e sem perda de dados para contas, cartões, categorias e lançamentos.',
        type: 'feature',
      },
      {
        title: 'Segurança e Sincronização em Nuvem',
        description: 'Isolamento multiusuário estrito, integridade relacional e sincronização resiliente.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.25',
    releaseDate: '2026-09-06',
    summary: 'Central de Ajuda com simulador 100% idêntico ao app Android, modo móvel sem poluição desktop e separação categorizada dos logs de versão.',
    highlights: [
      {
        title: 'Visualização 100% Idêntica ao App Android',
        description: 'Simulador interativo de tutoriais com reprodução fiel da carcaça do celular, entalhe de câmera, menu em arco de ações rápidas e faturas de cartão.',
        type: 'feature',
      },
      {
        title: 'Central de Ajuda 100% Focada no Celular',
        description: 'No aplicativo Android, os seletores e caixas de instrução do desktop foram ocultados, exibindo apenas o passo a passo nativo do celular.',
        type: 'feature',
      },
      {
        title: 'Separação Estruturada dos Logs de Versão',
        description: 'Destaques divididos visualmente entre Novas Funcionalidades, Correções & Fixes e Melhorias & Otimizações.',
        type: 'improvement',
      },
      {
        title: 'Navegação Direta e Sem Telas Sobrepostas',
        description: 'Acesso direto à página Sobre sem salto de modais intrusivos e fim de notificações locais para apps já atualizados.',
        type: 'fix',
      },
    ],
  },
  {
    version: '1.1.24',
    releaseDate: '2026-09-06',
    summary: 'Nova Central de Ajuda com tutoriais visuais para Web e Android, tela de boas-vindas móvel, fim de popups redundantes e logs categorizados.',
    highlights: [
      {
        title: 'Central de Ajuda & Tutoriais com Telas Marcadas',
        description: 'Nova base de conhecimento completa com tutoriais passo a passo, diagramas interativos com pinos numerados para Web e Android, FAQ e Helpdesk de suporte.',
        type: 'feature',
      },
      {
        title: 'Tela de Boas-Vindas no App Android',
        description: 'Exibição da tela de novidades e notas de versão no primeiro acesso após a atualização no aplicativo Android nativo, com fechamento suave no botão voltar.',
        type: 'feature',
      },
      {
        title: 'Navegação Direta sem Salto de Telas',
        description: 'Ao entrar na aba Sobre ou verificar atualizações, o app agora exibe o status diretamente na página, sem abrir modais sobrepostos indesejados.',
        type: 'fix',
      },
      {
        title: 'Zero Notificações Invasivas na Barra de Status',
        description: 'Remoção de notificações locais na barra de status quando o app já está atualizado. Notificações só disparam quando houver nova versão real.',
        type: 'fix',
      },
      {
        title: 'Deduplicação de Verificação com Trava Promise',
        description: 'Bloqueio de requisições simultâneas para evitar que múltiplos componentes disparem checagens e alertas em paralelo.',
        type: 'improvement',
      },
      {
        title: 'Separação Estruturada dos Logs de Versão',
        description: 'Organização visual dos registros entre Novas Funcionalidades, Correções & Fixes e Melhorias & Otimizações.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.23',
    releaseDate: '2026-09-06',
    summary: 'Correção definitiva de sincronização de versão, notas dinâmicas e fim dos alertas repetidos.',
    highlights: [
      {
        title: 'Sincronização Unificada de Versão',
        description: 'Eliminação da divergência de versões entre cliente, backend e build, garantindo que o app reconheça imediatamente a versão correta instalada.',
        type: 'fix',
      },
      {
        title: 'Fim dos Alertas e Notificações Repetidas',
        description: 'Correção da comparação de versão e deduplicação de notificações locais: avisos só disparam quando houver versão estritamente mais recente, nunca repetindo alertas.',
        type: 'fix',
      },
      {
        title: 'Notas de Atualização Dinâmicas',
        description: 'Substituição das notas estáticas/chumbadas na aba Sobre por novidades reais e dinâmicas geradas a partir do registro oficial da versão.',
        type: 'feature',
      },
      {
        title: 'Histórico Completo de Versões no App',
        description: 'Nova central de changelog interativa na aba Sobre e no modal de atualização para consulta do histórico de entregas do Finly.',
        type: 'feature',
      },
      {
        title: 'Compilação Android e CI/CD Conectados',
        description: 'O workflow do GitHub Actions e o Gradle agora derivam a versão diretamente do manifesto oficial do projeto.',
        type: 'perf',
      },
    ],
  },
  {
    version: '1.1.22',
    releaseDate: '2026-09-06',
    summary: 'Lista detalhada de lançamentos ao pagar fatura e melhorias visuais.',
    highlights: [
      {
        title: 'Lançamentos Detalhados ao Pagar Fatura',
        description: 'Exibição completa dos lançamentos vinculados à fatura com ícones categorizados, parcelamento (ex: 2/5) e status no modal de pagamento.',
        type: 'feature',
      },
      {
        title: 'Reordenação do Speed Dial',
        description: 'Nova ordem intuitiva para lançamento rápido: 1) Receita, 2) Despesa, 3) Despesa Cartão, 4) Transferência.',
        type: 'visual',
      },
      {
        title: 'Ícone Vetorial de Categoria',
        description: 'Substituição do emoji por ícone vetorial PieChart consistente no card de despesas por categoria do dashboard.',
        type: 'visual',
      },
    ],
  },
  {
    version: '1.1.21',
    releaseDate: '2026-09-06',
    summary: 'Fluxo nativo de atualizações no Android e notificações em tempo real.',
    highlights: [
      {
        title: 'Fallback de Roteamento de Atualizações',
        description: 'Roteamento com fallback automático para o servidor de produção em caso de instabilidade de rede local no Android.',
        type: 'fix',
      },
      {
        title: 'Notificações Nativas no Android',
        description: 'Avisos prioritários via Capacitor Local Notifications com botão direto para download do APK.',
        type: 'feature',
      },
      {
        title: 'Suporte ao Botão Físico de Voltar',
        description: 'Fechamento suave do modal de atualização com integração ao botão nativo de voltar do celular.',
        type: 'fix',
      },
    ],
  },
  {
    version: '1.1.19',
    releaseDate: '2026-09-06',
    summary: 'Correção de layout flexbox no card de despesas e receitas por categoria.',
    highlights: [
      {
        title: 'Layout Horizontal de Despesas por Categoria',
        description: 'Correção de conflito de flexbox que impedia a visualização da coluna de barras de progresso e aderência ao orçamento.',
        type: 'fix',
      },
      {
        title: 'Layout Expandido para Receitas',
        description: 'Aplicação do padrão de duas colunas responsivo também para receitas por categoria.',
        type: 'visual',
      },
    ],
  },
  {
    version: '1.1.18',
    releaseDate: '2026-09-06',
    summary: 'Redimensionamento de cards, menu unificado e blindagem contra ghost-clicks.',
    highlights: [
      {
        title: 'Alternância de Largura de Cards no Dashboard',
        description: 'Opção de 1 ou 2 colunas para cada card com persistência personalizada na tela inicial.',
        type: 'feature',
      },
      {
        title: 'Prevenção de Ghost-Clicks Mobile',
        description: 'Eliminação de toques acidentais no backdrop ao selecionar transações em dispositivos touch.',
        type: 'fix',
      },
    ],
  },
];

export const CURRENT_RELEASE: ReleaseInfo = RELEASES[0];

export const getReleaseByVersion = (version: string): ReleaseInfo | undefined => {
  const clean = version.replace(/^v/, '').trim();
  return RELEASES.find(r => r.version === clean);
};
