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
export const CURRENT_BUILD_DATE = '2026-09-12';

export const RELEASES: ReleaseInfo[] = [
  {
    version: CURRENT_VERSION,
    releaseDate: '2026-09-12',
    summary: 'Consolidação e refinamento completo da árvore de Categorias e Subcategorias do Finly (20 categorias principais e 123 subcategorias especializadas), inclusão de novos segmentos para Criptomoedas e Software/Apps, padronização de Empréstimos e correção de refinamento visual no seletor de parcelas.',
    highlights: [
      {
        title: 'Árvore Consolidada de Categorias & Subcategorias',
        description: 'Estruturação definitiva com 20 categorias e 123 subcategorias limpas, eliminando redundâncias (Telefone, Periféricos, Livros Técnicos e Financiamento Imobiliário duplicado).',
        type: 'feature',
      },
      {
        title: 'Novas Subcategorias de Criptomoedas & Software',
        description: 'Adicionados suportes dedicados a Aporte em Criptomoedas, Resgate/Venda de Cripto, Rendimentos de Staking e Software/Aplicativos.',
        type: 'feature',
      },
      {
        title: 'Nomenclatura Operacional Precisa de Empréstimos',
        description: 'Padronização clara entre Empréstimo Tomado (e seu respectivo pagamento) e Empréstimo Concedido (e seu respectivo recebimento), com aliases automáticos de retrocompatibilidade.',
        type: 'improvement',
      },
      {
        title: 'Refinamento Visual no Seletor de Parcelas',
        description: 'Eliminação definitiva de contornos retangulares residuais no campo numérico de parcelas com a introdução da classe utilitária borderless-stepper-input e alinhamento de altura padronizada.',
        type: 'visual',
      },
    ],
  },
  {
    version: '1.1.63',
    releaseDate: '2026-09-12',
    summary: 'Aprimoramento do fluxo de cadastro e parcelamento: campo único inteligente de data (Data do Pagamento x Vencimento x Data da Compra) eliminando duplicidades, novo controle integrado de parcelas com ajuste rápido [-] e [+] e sanitização completa anti-zero à esquerda no teclado.',
    highlights: [
      {
        title: 'Campo Único Inteligente de Data no Cadastro',
        description: 'Eliminada a necessidade de preencher dois campos de data. O campo principal adapta seu significado automaticamente: Data do Pagamento (com suporte a lançamentos retroativos), Data de Vencimento (para despesas pendentes) ou Data da Compra (no cartão com fatura automática).',
        type: 'feature',
      },
      {
        title: 'Controle Integrado de Parcelas com Ajuste Rápido',
        description: 'Novo seletor direto com botões [-] e [+] lado a lado com o dropdown detalhado por parcela e atalhos rápidos de 1 toque, facilitando o parcelamento tanto na Web quanto no App Android.',
        type: 'improvement',
      },
      {
        title: 'Sanitização Anti-Zero à Esquerda (Leading Zero)',
        description: 'Correção de comportamento no teclado virtual onde o zero ficava preso à frente dos valores digitados na seleção de parcelas e nos cadastros de dívidas e financiamentos.',
        type: 'fix',
      },
      {
        title: 'Sincronização Contábil & Lembretes',
        description: 'Alinhamento automático das datas de vencimento com a conciliação de faturas, fluxo de caixa e alertas programados de pagamento.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.62',
    releaseDate: '2026-09-12',
    summary: 'Central analítica avançada de relatórios: Comparativos MoM (mês a mês) e Orçado vs Realizado, Curvas e Projeções de Financiamentos com simulador de amortização extraordinária, Diagnóstico da Regra 50/30/20 com Score de Saúde Financeira e alternador de layout (Modo Focado vs Grade Bento).',
    highlights: [
      {
        title: 'Comparativos MoM e Orçado vs Realizado',
        description: 'Análise detalhada de variações de despesas categoria por categoria entre meses (+R$, -R$, +%, -%) e acompanhamento de aderência ao teto orçamentário planejado.',
        type: 'feature',
      },
      {
        title: 'Curvas e Projeção de Financiamentos & Dívidas',
        description: 'Projeção matemática de decaimento do saldo devedor até a quitação, decomposição de parcelas (principal vs juros) e simulador interativo de amortização extraordinária (redução de prazo vs redução de parcela).',
        type: 'feature',
      },
      {
        title: 'Diagnóstico da Regra 50/30/20 & Score Financeiro',
        description: 'Classificação automática em Necessidades (50%), Desejos (30%) e Poupança (20%), cálculo da taxa de poupança (Savings Rate) e recomendações acionáveis de saúde financeira.',
        type: 'feature',
      },
      {
        title: 'Alternador de Layouts (Modo Focado vs Grade Bento)',
        description: 'Visualização adaptável permitindo alternar entre o modo focado detalhado e grade bento inspirada em dashboards modernos com persistência da preferência do usuário.',
        type: 'visual',
      },
      {
        title: 'Sincronização Contínua do Helpdesk',
        description: 'Novo tutorial passo a passo e perguntas frequentes adicionadas à Central de Ajuda cobrindo todos os novos recursos de relatórios e análises.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.61',
    releaseDate: '2026-09-12',
    summary: 'Séries explícitas de cartão de crédito e despesas fixas recorrentes: suporte a compras em andamento (05/12), Fatura de Destino autoritativa, rateio exato de centavos, horizonte de 12 meses, transferências unificadas e desacoplamento de impacto analítico vs financeiro.',
    highlights: [
      {
        title: 'Compras Parceladas em Andamento (05 de 12)',
        description: 'Permite cadastrar compras já iniciadas gerando lançamentos exclusivamente da parcela aberta em diante, mantendo as parcelas passadas como histórico pago sintetizado na timeline sem distorcer meses anteriores.',
        type: 'feature',
      },
      {
        title: 'Fatura de Destino e Rateio Exato de Centavos',
        description: 'A fatura de destino selecionada governa com autoridade absoluta a competência da primeira parcela controlada. O total da compra fecha com precisão matemática, alocando centavos residuais na última parcela.',
        type: 'improvement',
      },
      {
        title: 'Despesas Fixas com Variação Mensal de Valor',
        description: 'Modelo de séries com horizonte materializado de 12 meses (semanal, mensal e anual). Permite editar "Somente este mês" criando exceção ou "Este e os próximos" gerando regra futura.',
        type: 'feature',
      },
      {
        title: 'Exclusão Cirúrgica por Escopo',
        description: 'Modal inteligente para excluir "Somente esta", "Esta e as futuras" ou "Série inteira" (com dupla confirmação ao remover séries com histórico ou parcelas pagas).',
        type: 'feature',
      },
      {
        title: 'Transferência Unificada e Agendamento Futuro',
        description: 'Formulário limpo e direto com validações, agendamento de transferências para datas futuras sem debitar saldo imediatamente e alerta suave de saldo insuficiente.',
        type: 'improvement',
      },
      {
        title: 'Reembolso Parcial de Terceiros',
        description: 'Registro de recebimentos parciais ou integrais com escolha de conta e data, mantendo a obrigação real da fatura e isolando o valor dos relatórios pessoais.',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.1.60',
    releaseDate: '2026-09-11',
    summary: 'Diagnóstico analítico de financiamentos imobiliários: Eficiência da Parcela (% amortização), indicador de variação do saldo (TR vs Amortização) e auditoria matemática centavo a centavo.',
    highlights: [
      {
        title: 'Eficiência da Parcela (% Amortização Real)',
        description: 'Exibe exatamente quanto de cada prestação paga realmente abate o saldo devedor principal versus encargos de juros, seguros e taxas administrativas.',
        type: 'feature',
      },
      {
        title: 'Diagnóstico de Variação Real do Saldo (TR)',
        description: 'Alerta educativo transparente para financiamentos Price longos (ex: 420 meses), detectando quando a correção monetária pela TR supera a amortização mensal.',
        type: 'improvement',
      },
      {
        title: 'Auditoria Oficial do Contrato Caixa SFH',
        description: 'Suíte de testes automatizados validando a decomposição exata da prestação emitida (juros, amortização e seguros), preservando subsídios do FGTS fora do encargo a pagar.',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.1.59',
    releaseDate: '2026-09-11',
    summary: 'Progressão monetária contínua para financiamentos Price + TR (Caixa Econômica Federal) ancorados na parcela emitida e indexação escalonada de seguros MIP/DFI.',
    highlights: [
      {
        title: 'Progressão Real da Tabela Price com TR',
        description: 'As parcelas futuras de financiamentos habitacionais agora progridem mensalmente pela TR a partir do mês base, eliminando reduções indevidas em relação ao mês vigente.',
        type: 'fix',
      },
      {
        title: 'Indexação de Seguros Habitacionais (MIP/DFI)',
        description: 'Os prêmios de seguro e encargos acompanham a evolução monetária do contrato, reproduzindo com exatidão centesimal os demonstrativos oficiais da Caixa.',
        type: 'improvement',
      },
      {
        title: 'Saneamento e Deduplicação Atômica',
        description: 'Reconciliação e limpeza automática de parcelas pendentes legadas no banco de dados e extrato.',
        type: 'fix',
      },
    ],
  },
  {
    version: '1.1.58',
    releaseDate: '2026-09-10',
    summary: 'Unificação do cronograma de financiamentos habitacionais (SFH / Caixa): regras matemáticas de amortização e liquidação exatas, cálculo Price/SAC com TR e quitação precisa do saldo devedor.',
    highlights: [
      {
        title: 'Amortização & Saldo Devedor SFH/Caixa',
        description: 'Baixa de parcelas passa a amortizar estritamente o principal após correção monetária, separando juros, seguros e taxas administrativas.',
        type: 'feature',
      },
      {
        title: 'Convergência Exata na Tabela Price com TR',
        description: 'Recálculo mês a mês sobre o prazo remanescente garante que o saldo devedor convirja para R$ 0,00 no término do contrato.',
        type: 'fix',
      },
      {
        title: 'Parcelas Reais vs Futuras',
        description: 'Edições na parcela emitida aplicam-se exclusivamente ao mês vigente, preservando a projeção matemática das parcelas futuras.',
        type: 'fix',
      },
      {
        title: 'Suporte a Contratos Prefixados',
        description: 'Contratos prefixados passam a operar com taxa de indexação zero, sem aplicação indevida de TR.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.57',
    releaseDate: '2026-09-10',
    summary: 'Financiamentos estruturados agora conciliam as parcelas pendentes do Extrato usando o valor real salvo no contrato, preservando parcelas pagas e evitando divergências entre a dívida e os lançamentos.',
    highlights: [
      {
        title: 'Parcelas pelo Valor Real do Contrato',
        description: 'Lançamentos pendentes de financiamentos Price/SAC com juros passam a respeitar a prestação mensal salva, evitando valores calculados abaixo do esperado.',
        type: 'fix',
      },
      {
        title: 'Edições Refletidas no Extrato',
        description: 'Ao alterar o financiamento, a reconciliação atualiza as parcelas futuras vinculadas sem duplicar transações e sem alterar pagamentos já concluídos.',
        type: 'fix',
      },
      {
        title: 'Cobertura de Regressão',
        description: 'Novo teste cobre financiamento estruturado com juros para impedir que a divergência de parcelas retorne em alterações futuras.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.56',
    releaseDate: '2026-09-10',
    summary: 'Cálculo de parcelas em tempo real com decomposição detalhada (Amortização, Juros, Seguros MIP/DFI e Taxa de Administração), sincronização determinística e atualização automática de parcelas pendentes.',
    highlights: [
      {
        title: 'Estimativa de Parcela em Tempo Real',
        description: 'Detalhamento visual ao vivo de amortização, juros, seguros e taxas no formulário de dívidas com botão de aplicação instantânea.',
        type: 'feature',
      },
      {
        title: 'Reflexo Automático nas Parcelas Pendentes',
        description: 'Alterações no valor da prestação, seguros ou taxa de juros atualizam instantaneamente as parcelas não pagas vinculadas.',
        type: 'feature',
      },
      {
        title: 'Exclusão Atômica e Limpeza de Vínculos',
        description: 'Exclusão completa e sincronizada de contratos de financiamento e todas as suas transações pendentes tanto no estado local quanto no Supabase.',
        type: 'fix',
      },
      {
        title: 'Sincronização Determinística de Transações',
        description: 'Identificadores estáveis por contrato e parcela evitam criação de transações duplicadas e garantem integridade referencial.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.55',
    releaseDate: '2026-09-10',
    summary: 'Cálculo automático de parcelas Price/SAC, persistência bilateral de financiamentos no Supabase e conciliação estruturada.',
    highlights: [
      {
        title: 'Cálculo Automático Price e SAC',
        description: 'Prestação calculada com precisão incluindo juros, correção pela TR oficial do BACEN, seguros MIP/DFI e taxa de administração.',
        type: 'feature',
      },
      {
        title: 'Persistência Completa no Supabase',
        description: 'Tabela de dívidas e transações agora persistem tipo de contrato, sistema de amortização, indexador e vínculos de parcelas.',
        type: 'feature',
      },
      {
        title: 'Inferência Inteligente de Legados',
        description: 'Dívidas existentes sem tipo de contrato são classificadas automaticamente por heurística de título e credor ao editar.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.54',
    releaseDate: '2026-09-09',
    summary: 'Correção do cadastro de despesas e migração automática das parcelas de dívidas e financiamentos para o extrato.',
    highlights: [
      {
        title: 'Despesas restauradas em Transações',
        description: 'Lançamentos simples voltam a ser incluídos imediatamente no extrato; repetições também deixam de criar uma cópia extra.',
        type: 'fix',
      },
      {
        title: 'Parcelas antigas migradas automaticamente',
        description: 'Contratos de dívida e financiamento já existentes passam a gerar suas parcelas pendentes no Extrato e no Calendário.',
        type: 'fix',
      },
      {
        title: 'Vínculos duráveis e sem duplicidade',
        description: 'A associação entre parcela e contrato agora sobrevive à sincronização com o Supabase e às recargas do aplicativo.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.53',
    releaseDate: '2026-09-09',
    summary: 'Financiamento Habitacional Caixa, Tabela Price e SAC com correção monetária pela TR diária oficial do Banco Central (SGS), cronograma de 420 parcelas e simulador de amortização extraordinária.',
    highlights: [
      {
        title: 'Financiamento Imobiliário & Habitacional Caixa',
        description: 'Módulo dedicado para gestão de contratos habitacionais com suporte a Tabela Price (TP) e SAC, seguros MIP/DFI e taxa de administração.',
        type: 'feature',
      },
      {
        title: 'Taxa TR Oficial em Tempo Real (BACEN SGS)',
        description: 'Integração direta com o Banco Central do Brasil para buscar automaticamente a TR diária da Série 226 e IPCA da Série 433.',
        type: 'feature',
      },
      {
        title: 'Evolução & Cronograma Completo (420 Meses)',
        description: 'Demonstrativo interativo idêntico ao da Caixa com detalhamento de amortização, juros corrigidos, seguros e saldo devedor.',
        type: 'feature',
      },
      {
        title: 'Parcelas de Dívidas no Extrato',
        description: 'Parcelas pendentes de dívidas e financiamentos agora aparecem no Extrato e no Calendário, com pagamento e saldo devedor sincronizados sem duplicidades.',
        type: 'feature',
      },
      {
        title: 'Simulador de Amortização Extraordinária',
        description: 'Simulação de aportes únicos (FGTS) e aportes mensais recorrentes comparando lado a lado a redução de prazo contra a redução de prestação.',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.1.52',
    releaseDate: '2026-09-09',
    summary: 'Design System Fikri Studio com Bento Grid e iluminação radial, novo cartão oficial Bradesco Neo, banco Credicard On, teclado virtual inteligente sem cortes e notificações centralizadas.',
    highlights: [
      {
        title: 'Design System Fikri Studio & Bento Grid',
        description: 'Hero Balance Card com iluminação radial violeta, métricas monoespelhadas, micro-pílulas de contexto e cards modulares de receitas e despesas com barras de proporção.',
        type: 'visual',
      },
      {
        title: 'Cartão Oficial Bradesco Neo & Credicard On',
        description: 'Tema fiel ao cartão físico Bradesco Neo com gradiente tricolor diagonal (vermelho, violeta e azul) e suporte completo ao emissor Credicard On.',
        type: 'visual',
      },
      {
        title: 'Teclado Virtual Inteligente sem Cortes',
        description: 'Modais e campos de texto com ajuste dinâmico ao abrir o teclado virtual no Android e Web, mantendo a área de digitação e botões sempre visíveis.',
        type: 'improvement',
      },
      {
        title: 'Centralização de Notificações',
        description: 'Gerenciamento de notificações unificado exclusivamente no ícone do sino no cabeçalho, simplificando a navegação na aba Mais Opções.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.51',
    releaseDate: '2026-09-09',
    summary: 'Desacoplamento e liberdade total de customização de cores para cartões e contas, paletas visuais rápidas e restauração da cor do banco.',
    highlights: [
      {
        title: 'Cores Desacopladas do Banco',
        description: 'Personalização livre de cores para cartões e contas sem que a escolha do banco sobrescreva a cor desejada.',
        type: 'feature',
      },
      {
        title: 'Paletas Rápidas e Seletor HEX',
        description: 'Novo seletor com chips de cores vibrantes e elegantes, além de suporte a qualquer código hexadecimal.',
        type: 'visual',
      },
      {
        title: 'Restauração da Cor Oficial',
        description: 'Botão de 1-clique para restaurar a cor oficial do banco selecionado a qualquer momento.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.50',
    releaseDate: '2026-09-09',
    summary: 'Sincronização em tempo real via SSE (Server-Sent Events), prevenção contra exclusão indevida de cartões e esteira de build do APK estável.',
    highlights: [
      {
        title: 'Sincronização Push em Tempo Real',
        description: 'Transmissão instantânea de eventos de sincronização via SSE (/api/sync/events), mantendo Web e App Mobile sempre sincronizados.',
        type: 'feature',
      },
      {
        title: 'Reconciliação e Blindagem de Cartões',
        description: 'Eliminação da exclusão indevida de cartões no ciclo de heartbeat e preservação de campos no formulário.',
        type: 'fix',
      },
      {
        title: 'Esteira de Build e APK Estável',
        description: 'Atualização e sincronização completa dos manifests para geração e publicação automática do APK no GitHub Releases.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.49',
    releaseDate: '2026-09-09',
    summary: 'Novos emissores e logotipos oficiais de cartões em alta definição: Cartão Amazon, Bradescard, Casas Bahia Card, Cartão Americanas, Santander Way, Bradesco Neo e Cartão Carrefour.',
    highlights: [
      {
        title: '7 Novos Cartões Oficiais',
        description: 'Suporte completo a Cartão Amazon, Bradescard, Casas Bahia Card, Cartão Americanas, Santander Way, Bradesco Neo e Cartão Carrefour com cores e gradientes oficiais.',
        type: 'feature',
      },
      {
        title: 'Logotipos Vetoriais em Alta Definição',
        description: 'Ícones vetoriais SVG nítidos e padronizados em todos os tamanhos, cards e modais.',
        type: 'visual',
      },
      {
        title: 'Reconhecimento e Central de Ajuda',
        description: 'Vínculo inteligente por palavras-chave e FAQ detalhado sobre emissores suportados.',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.48',
    releaseDate: '2026-09-09',
    summary: 'Persistência confiável de cartões e preferências locais, com grade modular responsiva no dashboard.',
    highlights: [
      {
        title: 'Persistência Blindada',
        description: 'Cartões protegidos contra snapshots parciais e fila serializada de mutações no Supabase e API.',
        type: 'fix',
      },
      {
        title: 'Dashboard com Masonry',
        description: 'Cálculo de altura real e eliminação de lacunas artificiais na tela inicial.',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.1.47',
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
