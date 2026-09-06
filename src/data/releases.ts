/**
 * Finly Release Registry & Version History
 * Single Source of Truth for App Versioning, Changelog and In-App Release Notes.
 */

export interface ReleaseHighlight {
  title: string;
  description: string;
  type?: 'feature' | 'fix' | 'visual' | 'perf';
}

export interface ReleaseInfo {
  version: string;
  releaseDate: string;
  summary: string;
  highlights: ReleaseHighlight[];
}

export const CURRENT_VERSION = '1.1.23';
export const CURRENT_BUILD_DATE = '2026-09-06';

export const RELEASES: ReleaseInfo[] = [
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
