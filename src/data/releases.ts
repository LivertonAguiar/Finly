/**
 * Finly Release Registry & Version History
 * Single Source of Truth for App Versioning, Changelog and In-App Release Notes.
 */

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

export const CURRENT_VERSION = '1.1.31';
export const CURRENT_BUILD_DATE = '2026-09-07';

export const RELEASES: ReleaseInfo[] = [
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
