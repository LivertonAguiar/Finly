/**
 * Finly Help Center & Knowledge Base Data
 * Structured visual step-by-step guides, annotated callouts, and FAQs for Web & Android.
 */

export interface VisualCallout {
  area: 'header' | 'sidebar' | 'bottom_nav' | 'fab' | 'modal' | 'cards_tab' | 'filters' | 'settings';
  targetLabel: string;
  webDescription: string;
  androidDescription: string;
  hotspotX: number; // percentage 0-100
  hotspotY: number; // percentage 0-100
}

export interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  webInstruction: string;
  androidInstruction: string;
  tip?: string;
  callout?: VisualCallout;
}

export interface HelpGuide {
  id: string;
  title: string;
  category: 'primeiros_passos' | 'transacoes' | 'cartoes' | 'contas' | 'planejamento' | 'ofx' | 'mobile_web' | 'configuracoes';
  categoryLabel: string;
  summary: string;
  readTime: string;
  badge?: string;
  steps: GuideStep[];
  commonMistake?: string;
  relatedFaqIds?: string[];
}

export interface HelpFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export interface HelpCategoryDef {
  id: HelpGuide['category'];
  label: string;
  iconName: string;
  description: string;
  colorClass: string;
}

export const HELP_CATEGORIES: HelpCategoryDef[] = [
  {
    id: 'primeiros_passos',
    label: 'Primeiros Passos',
    iconName: 'Sparkles',
    description: 'Conceitos básicos, navegação inicial e primeiros lançamentos',
    colorClass: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'transacoes',
    label: 'Transações & Despesas',
    iconName: 'ArrowDownCircle',
    description: 'Como lançar receitas, despesas, parcelamentos e anexar comprovantes',
    colorClass: 'from-rose-500 to-pink-600',
  },
  {
    id: 'cartoes',
    label: 'Cartões & Faturas',
    iconName: 'CreditCard',
    description: 'Cadastro de cartões, limites, parcelas, extrato e pagamento de fatura',
    colorClass: 'from-amber-500 to-orange-600',
  },
  {
    id: 'contas',
    label: 'Contas & Saldos',
    iconName: 'Building2',
    description: 'Bancos, carteiras físicas, saldo inicial e conciliação',
    colorClass: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'planejamento',
    label: 'Orçamento & Metas',
    iconName: 'Target',
    description: 'Definição de tetos mensais por categoria e metas de poupança',
    colorClass: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'ofx',
    label: 'Extratos & OFX',
    iconName: 'FileSpreadsheet',
    description: 'Importação automática de extratos bancários sem digitação manual',
    colorClass: 'from-violet-500 to-purple-600',
  },
  {
    id: 'mobile_web',
    label: 'Recursos do App Android',
    iconName: 'Smartphone',
    description: 'Navegação ergonômica, menu em arco, notificações no celular e atualizações',
    colorClass: 'from-sky-500 to-indigo-600',
  },
  {
    id: 'configuracoes',
    label: 'Configurações & Backup',
    iconName: 'Settings',
    description: 'Modo escuro, personalização da barra, segurança e exportação',
    colorClass: 'from-slate-600 to-slate-800',
  },
];

export const HELP_GUIDES: HelpGuide[] = [
  {
    id: 'como-lancar-despesa',
    title: 'Como lançar uma despesa rápida (à vista ou no cartão)',
    category: 'transacoes',
    categoryLabel: 'Transações & Despesas',
    summary: 'Aprenda o fluxo de lançamento de gastos, seleção de categoria, conta bancária ou cartão e parcelamento.',
    readTime: '2 min',
    badge: 'Mais Acessado',
    steps: [
      {
        stepNumber: 1,
        title: 'Abrir o Formulário de Nova Transação',
        description: 'Inicie um novo lançamento a partir de qualquer tela do aplicativo.',
        webInstruction: 'No canto superior direito do cabeçalho ou no topo da barra lateral, clique no botão roxo "+ Nova Transação" (ou utilize o atalho de teclado "N").',
        androidInstruction: 'Na parte inferior central da tela, toque no botão circular roxo com ícone de "+". No menu em arco que se abrirá, toque no ícone vermelho de "Despesa".',
        tip: 'No app Android, você pode abrir diretamente uma despesa de cartão escolhendo o ícone amarelo de cartão no menu em arco.',
        callout: {
          area: 'header',
          targetLabel: 'Botão Nova Transação / Botão Flutuante (+)',
          webDescription: 'Localizado no topo superior direito da barra superior',
          androidDescription: 'Botão flutuante central na barra de navegação inferior',
          hotspotX: 85,
          hotspotY: 15,
        },
      },
      {
        stepNumber: 2,
        title: 'Preencher Valor, Descrição e Categoria',
        description: 'Informe quanto gastou, o motivo e escolha a categoria correta para manter seus relatórios precisos.',
        webInstruction: 'Digite o valor numérico (o Finly formata os centavos automaticamente). Escreva a descrição (ex: "Supermercado Semanal") e selecione a categoria.',
        androidInstruction: 'Use o teclado numérico para inserir o valor. Toque no seletor de categorias com ícones coloridos para classificar rapidamente o gasto.',
        tip: 'O Finly aprende suas categorias frequentes e sugere automaticamente pela descrição.',
        callout: {
          area: 'modal',
          targetLabel: 'Campos do Modal de Transação',
          webDescription: 'Janela central com campos rápidos de preenchimento',
          androidDescription: 'Folha inferior que sobe ocupando a tela com facilidade de toque',
          hotspotX: 50,
          hotspotY: 45,
        },
      },
      {
        stepNumber: 3,
        title: 'Escolher a Origem do Pagamento: Conta ou Cartão',
        description: 'Defina se o valor sai do saldo da sua conta corrente imediatamente ou se entra na fatura de um cartão de crédito.',
        webInstruction: 'Na aba "Forma de Pagamento", escolha "Conta Bancária" ou "Cartão de Crédito". Se escolher cartão, selecione a quantidade de parcelas se houver.',
        androidInstruction: 'Alterne entre as abas "Conta" e "Cartão" no topo do formulário. Selecionando cartão, o campo de parcelas (1x a 24x) aparece automaticamente.',
        tip: 'Gastos em cartão não abatem do seu saldo em conta até o dia em que você pagar a fatura!',
        callout: {
          area: 'modal',
          targetLabel: 'Seletor Conta x Cartão',
          webDescription: 'Abas de seleção na parte intermediária do modal',
          androidDescription: 'Abas táteis com ícones de banco e cartão',
          hotspotX: 50,
          hotspotY: 60,
        },
      },
      {
        stepNumber: 4,
        title: 'Confirmar e Salvar',
        description: 'Finalize o lançamento para atualizar imediatamente os relatórios e o saldo.',
        webInstruction: 'Clique no botão verde/roxo "Salvar Despesa" ou pressione Enter no teclado.',
        androidInstruction: 'Toque no botão largo "Salvar" na base da tela. Uma suave vibração confirmará o registro com sucesso.',
        callout: {
          area: 'modal',
          targetLabel: 'Botão Salvar',
          webDescription: 'Botão no rodapé direito do modal',
          androidDescription: 'Botão largo ocupando a largura inferior do display',
          hotspotX: 50,
          hotspotY: 85,
        },
      },
    ],
    commonMistake: 'Lançar uma despesa de cartão escolhendo a conta bancária. Isso debita seu saldo bancário antes da fatura fechar!',
    relatedFaqIds: ['faq-cartao-vs-conta', 'faq-parcelamento'],
  },
  {
    id: 'como-gerenciar-cartoes-e-faturas',
    title: 'Como controlar cartões de crédito e pagar faturas',
    category: 'cartoes',
    categoryLabel: 'Cartões & Faturas',
    summary: 'Veja como cadastrar cartões, acompanhar o melhor dia de compra, consultar itens da fatura e registrar pagamentos parciais ou totais.',
    readTime: '3 min',
    badge: 'Essencial',
    steps: [
      {
        stepNumber: 1,
        title: 'Acessar a Seção de Cartões de Crédito',
        description: 'Vá para a central de gestão de cartões para visualizar todos os plásticos cadastrados.',
        webInstruction: 'No menu lateral esquerdo, clique no item "Cartões de crédito" (ícone de cartão).',
        androidInstruction: 'No celular, toque no botão central (+) e selecione o atalho "💳 Cartões" (ou acesse pela aba "Mais" -> "Cartões de Crédito").',
        callout: {
          area: 'sidebar',
          targetLabel: 'Atalho Cartões',
          webDescription: '4º item da barra lateral esquerda',
          androidDescription: 'Atalho no menu (+) ou na aba Mais',
          hotspotX: 12,
          hotspotY: 32,
        },
      },
      {
        stepNumber: 2,
        title: 'Entender o Card do Cartão e o Ciclo da Fatura',
        description: 'O Finly calcula em tempo real o limite utilizado, o limite disponível, o dia de fechamento e o melhor dia de compra.',
        webInstruction: 'Cada cartão exibe a barra de progresso do limite e um badge indicando se a fatura atual está "Aberta", "Fechada" ou "Paga".',
        androidInstruction: 'Deslize horizontalmente entre os cartões para ver o limite disponível, data de vencimento e valor da fatura atual.',
        tip: 'O "Melhor dia de compra" é o dia seguinte ao fechamento da fatura, garantindo até 40 dias de prazo para pagar.',
        callout: {
          area: 'cards_tab',
          targetLabel: 'Visual do Cartão & Limite',
          webDescription: 'Grade visual de cartões coloridos com limites e barras de progresso',
          androidDescription: 'Carrossel moderno com cartões estilizados',
          hotspotX: 50,
          hotspotY: 30,
        },
      },
      {
        stepNumber: 3,
        title: 'Consultar os Lançamentos da Fatura',
        description: 'Veja todos os itens que compõem a fatura antes de realizar o pagamento.',
        webInstruction: 'Clique sobre o cartão desejado ou no botão "Ver Detalhes / Fatura" para expandir a lista de lançamentos discriminada por categoria e parcelas.',
        androidInstruction: 'Toque no cartão para abrir a visualização detalhada. Você verá cada compra com a etiqueta de parcela (ex: 2/5).',
        callout: {
          area: 'cards_tab',
          targetLabel: 'Lista de Lançamentos da Fatura',
          webDescription: 'Tabela discriminada com ícones de categoria e status individual',
          androidDescription: 'Lista tátil com badges coloridos e data de cada compra',
          hotspotX: 50,
          hotspotY: 60,
        },
      },
      {
        stepNumber: 4,
        title: 'Pagar a Fatura (Total ou Parcial)',
        description: 'Liquide a fatura debitando de uma das suas contas bancárias cadastradas.',
        webInstruction: 'Clique no botão verde "Pagar Fatura". Na tela que se abrirá, confira os lançamentos, escolha a conta de débito bancário, confirme a data e clique em "Confirmar Pagamento".',
        androidInstruction: 'Toque no botão "Pagar Fatura". Selecione a conta bancária de onde sairá o dinheiro e confirme. O limite do cartão é restabelecido na hora!',
        tip: 'Ao pagar a fatura, uma transação de débito é gerada na conta bancária selecionada automaticamente.',
        callout: {
          area: 'cards_tab',
          targetLabel: 'Botão Pagar Fatura',
          webDescription: 'Botão de destaque no card de detalhes da fatura',
          androidDescription: 'Botão verde de ação rápida na parte inferior da tela do cartão',
          hotspotX: 75,
          hotspotY: 45,
        },
      },
    ],
    commonMistake: 'Esquecer de informar o dia de fechamento correto ao cadastrar o cartão. Isso faz o Finly alocar compras no mês errado!',
    relatedFaqIds: ['faq-pagar-fatura', 'faq-limite-cartao'],
  },
  {
    id: 'como-importar-extrato-ofx-csv',
    title: 'Como importar extratos bancários (OFX e CSV)',
    category: 'ofx',
    categoryLabel: 'Extratos & OFX',
    summary: 'Importe meses inteiros de transações do seu banco (Nubank, Itaú, Bradesco, Inter, Santander) com categorização automática.',
    readTime: '2 min',
    badge: 'Produtividade',
    steps: [
      {
        stepNumber: 1,
        title: 'Exportar o arquivo OFX no seu Internet Banking ou App do Banco',
        description: 'Baixe o extrato no formato padrão financeiro no site do seu banco.',
        webInstruction: 'Acesse o site do seu banco, vá em Extrato, escolha o período desejado e clique em "Exportar OFX" (ou "Money / Quicken").',
        androidInstruction: 'No app do seu banco no celular, compartilhe ou baixe o extrato em formato OFX ou CSV e salve nos seus arquivos.',
        tip: 'Sempre prefira o formato .OFX ao invés de PDF, pois o OFX contém dados estruturados com valores e datas exatas.',
      },
      {
        stepNumber: 2,
        title: 'Acessar a Ferramenta de Importação no Finly',
        description: 'Abra o assistente de conciliação bancária.',
        webInstruction: 'Acesse a aba "Contas" ou "Transações" e clique no botão com ícone de arquivo "Importar Extrato (OFX/CSV)".',
        androidInstruction: 'Na aba "Mais" -> "Importação de Extratos" ou no botão superior de importação na aba Contas.',
        callout: {
          area: 'header',
          targetLabel: 'Botão Importar OFX',
          webDescription: 'Botão ao lado do filtro de datas na tela de Transações',
          androidDescription: 'Opção dedicada na tela de Contas ou menu Mais',
          hotspotX: 65,
          hotspotY: 15,
        },
      },
      {
        stepNumber: 3,
        title: 'Selecionar o Arquivo e a Conta de Destino',
        description: 'Arraste o arquivo ou selecione do computador/celular e indique qual conta bancária do Finly deve receber os dados.',
        webInstruction: 'Arraste o arquivo .ofx para a caixa de upload ou clique em "Selecionar Arquivo". Escolha a conta correspondente.',
        androidInstruction: 'Toque para escolher o arquivo na pasta de Downloads do seu celular Android e selecione a conta.',
        callout: {
          area: 'modal',
          targetLabel: 'Zona de Drop / Upload OFX',
          webDescription: 'Área retangular com borda tracejada para soltar o arquivo',
          androidDescription: 'Botão de seleção de arquivo compatível com o gerenciador do Android',
          hotspotX: 50,
          hotspotY: 40,
        },
      },
      {
        stepNumber: 4,
        title: 'Revisar Transações e Confirmar Importação',
        description: 'O Finly exibe uma prévia com categorização automática inteligente.',
        webInstruction: 'Verifique os lançamentos detectados, ajuste categorias se necessário e clique em "Confirmar e Importar Todos".',
        androidInstruction: 'Revise a lista de transações e toque no botão verde para sincronizar com sua conta.',
        tip: 'Transações que já foram cadastradas anteriormente são identificadas para evitar lançamentos duplicados.',
      },
    ],
    commonMistake: 'Tentar importar arquivo PDF ou foto do extrato. O leitor automático requer arquivos nos formatos .OFX, .QIF ou .CSV!',
    relatedFaqIds: ['faq-formato-ofx', 'faq-duplicidade-ofx'],
  },
  {
    id: 'como-configurar-orcamentos-e-metas',
    title: 'Como definir tetos de gastos e metas financeiras',
    category: 'planejamento',
    categoryLabel: 'Orçamento & Metas',
    summary: 'Mantenha suas despesas sob controle estipulando limites por categoria com notificações aos 80% e 100% de consumo.',
    readTime: '2 min',
    steps: [
      {
        stepNumber: 1,
        title: 'Acessar a Aba Planejamento / Orçamentos',
        description: 'Abra a matriz de planejamento financeiro mensal.',
        webInstruction: 'Na barra lateral, clique em "Planejamento" (ícone de bandeira).',
        androidInstruction: 'Toque na aba "Mais" (5º ícone da barra inferior) e selecione "Planejamento" (ícone de bandeira).',
        callout: {
          area: 'bottom_nav',
          targetLabel: 'Menu Mais → Planejamento',
          webDescription: '5º item do menu lateral',
          androidDescription: 'Acesse pela aba "Mais" (5º ícone) → "Planejamento"',
          hotspotX: 90,
          hotspotY: 95,
        },
      },
      {
        stepNumber: 2,
        title: 'Estipular o Teto de Gastos por Categoria',
        description: 'Defina quanto você aceita gastar no mês em Alimentação, Transporte, Lazer, etc.',
        webInstruction: 'Clique em "+ Novo Orçamento" ou edite o valor limite ao lado de cada categoria na lista.',
        androidInstruction: 'Toque no botão de adicionar ou toque diretamente no valor da categoria para editar o teto.',
        tip: 'O Finly calcula a média dos seus meses anteriores para sugerir limites realistas!',
      },
      {
        stepNumber: 3,
        title: 'Acompanhar a Barra de Consumo e Alertas',
        description: 'Conforme você lança despesas no dia a dia, a barra de progresso muda de cor.',
        webInstruction: 'Verde (abaixo de 70%), Amarelo (entre 70% e 99%) e Vermelho com alerta quando ultrapassar 100%.',
        androidInstruction: 'Receba notificações nativas no celular assim que atingir 80% e 100% do limite estipulado.',
      },
    ],
    relatedFaqIds: ['faq-alerta-orcamento'],
  },
  {
    id: 'diferencas-web-vs-android',
    title: 'Guia do Usuário: Recursos e Atalhos do Aplicativo Finly',
    category: 'mobile_web',
    categoryLabel: 'Recursos do App Android',
    summary: 'Aprenda a tirar o máximo proveito do aplicativo Finly no seu celular: navegação inferior, menu em arco e notificações em tempo real.',
    readTime: '3 min',
    badge: 'Guia Visual',
    steps: [
      {
        stepNumber: 1,
        title: 'Navegação e Barra Inferior Mobile',
        description: 'Barra de navegação ergonômica posicionada estrategicamente para alcance fácil com o polegar.',
        webInstruction: 'No Computador: Acesso rápido pela barra lateral expansível e atalhos de teclado.',
        androidInstruction: 'Na parte inferior do celular, você tem acesso imediato a Principal, Transações, (+) Ações Rápidas, Cartões e Mais (com Planejamento e módulos avançados), com suporte completo à área segura do aparelho.',
      },
      {
        stepNumber: 2,
        title: 'Lançamentos Rápidos com Menu em Arco',
        description: 'Agilidade máxima para lançamentos de gastos ou receitas no dia a dia.',
        webInstruction: 'No Computador: Clique no botão "+ Nova Transação" no topo ou pressione a tecla "N".',
        androidInstruction: 'Toque no botão central circular com (+). Abre-se um leque com 4 atalhos rápidos: Receita, Despesa, Despesa de Cartão e Transferência.',
      },
      {
        stepNumber: 3,
        title: 'Notificações e Atualizações',
        description: 'Mantenha-se em dia com suas finanças e com a versão mais recente.',
        webInstruction: 'No Computador: O app se atualiza automaticamente na nuvem sem necessidade de downloads.',
        androidInstruction: 'Receba avisos na barra de status do celular sobre faturas e baixe atualizações do APK na aba Sobre com 1 toque.',
      },
    ],
    relatedFaqIds: ['faq-atualizacao-android', 'faq-offline'],
  },
  {
    id: 'seguranca-senha-biometria',
    title: 'Como alterar sua senha e ativar o bloqueio por digital/PIN',
    category: 'configuracoes',
    categoryLabel: 'Configurações & Segurança',
    summary: 'Aprenda onde gerenciar sua senha de acesso, ativar o bloqueio por código PIN de 4 dígitos e cadastrar sua digital (TouchID/FaceID) no Finly.',
    readTime: '2 min',
    badge: 'Segurança',
    steps: [
      {
        stepNumber: 1,
        title: 'Acessar Meu Perfil',
        description: 'Toda a gestão de segurança pessoal, credenciais e biometria está centralizada na aba Meu Perfil.',
        webInstruction: 'Clique no seu avatar ou nome no topo da tela ou na barra lateral para acessar "Meu Perfil".',
        androidInstruction: 'Acesse o menu inferior ou lateral e toque em "Perfil" ou no seu nome de usuário.',
      },
      {
        stepNumber: 2,
        title: 'Ativar o Bloqueio Biométrico & PIN',
        description: 'Proteja a abertura do Finly sempre que sair do aplicativo.',
        webInstruction: 'No cartão "Bloqueio Biométrico & PIN", marque a caixa de seleção e defina um código PIN numérico de 4 dígitos. Se o seu dispositivo tiver sensor biométrico ou Windows Hello, ative a opção de digital.',
        androidInstruction: 'Ative a chave "Bloqueio Biométrico & PIN". Defina seu código PIN e confirme a leitura da sua impressão digital quando solicitado pelo Android.',
      },
      {
        stepNumber: 3,
        title: 'Alterar a Senha da Conta',
        description: 'Atualize sua senha periodicamente para manter sua conta blindada.',
        webInstruction: 'No cartão "Segurança & Alteração de Senha", informe sua senha atual, digite a nova senha desejada e confirme. Clique em "Atualizar Senha".',
        androidInstruction: 'Role até o cartão "Segurança & Alteração de Senha", preencha a senha atual e a nova senha, e toque em "Atualizar Senha".',
      },
    ],
    relatedFaqIds: ['faq-alterar-senha-biometria', 'faq-seguranca-dados'],
  },
];

export const HELP_FAQS: HelpFaqItem[] = [
  {
    id: 'faq-cartao-vs-conta',
    question: 'Qual a diferença entre lançar uma despesa em "Conta Bancária" e em "Cartão de Crédito"?',
    answer: 'Quando você seleciona "Conta Bancária", o valor é subtraído imediatamente do saldo real da sua conta (ex: Pix ou débito). Quando escolhe "Cartão de Crédito", o valor entra na fatura atual do cartão e só abaterá do seu dinheiro em conta quando você efetivamente registrar o pagamento da fatura.',
    category: 'transacoes',
    tags: ['cartao', 'conta', 'saldo', 'despesa'],
  },
  {
    id: 'faq-pagar-fatura',
    question: 'Como faço para registrar o pagamento da minha fatura de cartão?',
    answer: 'Acesse a aba "Cartões", selecione o cartão desejado e clique no botão verde "Pagar Fatura". Você poderá conferir a lista de lançamentos que compõem a fatura, escolher a conta bancária de onde o dinheiro sairá e confirmar. O limite do cartão é restabelecido na mesma hora.',
    category: 'cartoes',
    tags: ['pagamento', 'fatura', 'limite', 'cartao'],
  },
  {
    id: 'faq-formato-ofx',
    question: 'Onde encontro o arquivo OFX no meu banco?',
    answer: 'No Internet Banking do seu banco (computador ou app), vá até a tela de Extrato Bancário. Procure pelo botão "Exportar", "Salvar Extrato" ou "Download" e selecione o formato OFX (alguns bancos chamam de "Money", "Quicken" ou simplesmente "OFX").',
    category: 'ofx',
    tags: ['ofx', 'banco', 'extrato', 'download'],
  },
  {
    id: 'faq-duplicidade-ofx',
    question: 'Se eu importar o mesmo extrato duas vezes, as despesas serão duplicadas?',
    answer: 'Não! O leitor inteligente de extratos do Finly possui algoritmo de deduplicação por hash de transação (data, valor e descrição). Lançamentos já existentes no sistema são sinalizados e ignorados para manter seus dados 100% íntegros.',
    category: 'ofx',
    tags: ['duplicidade', 'ofx', 'seguranca'],
  },
  {
    id: 'faq-atualizacao-android',
    question: 'Como atualizo o aplicativo Finly no meu celular Android?',
    answer: 'Acesse a aba "Mais" -> "Atualizações & Sobre o Finly". Se houver uma nova versão disponível na nuvem, você verá o botão "Baixar APK". Basta clicar nele, abrir o arquivo baixado e confirmar a instalação da atualização.',
    category: 'mobile_web',
    tags: ['atualizacao', 'android', 'apk', 'versao'],
  },
  {
    id: 'faq-alerta-orcamento',
    question: 'Como funcionam os alertas de limite de orçamento?',
    answer: 'Ao definir um orçamento mensal para uma categoria (ex: R$ 800 em Lazer), o Finly monitora seus gastos em tempo real. Ao atingir 80% do teto, um alerta preventivo é disparado; e aos 100%, você recebe um aviso sonoro/notificação indicando que o limite estipulado foi esgotado.',
    category: 'planejamento',
    tags: ['orcamento', 'alerta', 'limite', 'notificacao'],
  },
  {
    id: 'faq-seguranca-dados',
    question: 'Meus dados financeiros ficam seguros no Finly?',
    answer: 'Sim! Seus dados são criptografados e armazenados com total privacidade. O Finly não possui acesso à sua senha de banco nem realiza movimentações financeiras por você; trata-se de uma ferramenta estrita de planejamento, gestão e inteligência orçamentária pessoal.',
    category: 'configuracoes',
    tags: ['seguranca', 'privacidade', 'dados', 'banco'],
  },
  {
    id: 'faq-offline',
    question: 'Consigo usar o Finly sem internet (offline)?',
    answer: 'Sim! Graças à arquitetura PWA e Capacitor com banco de dados local IndexedDB / SQLite, você pode registrar gastos, consultar faturas e navegar pelo app mesmo sem conexão com a internet. Assim que o sinal for restabelecido, os dados são sincronizados automaticamente.',
    category: 'mobile_web',
    tags: ['offline', 'internet', 'sincronizacao'],
  },
  {
    id: 'faq-alterar-senha-biometria',
    question: 'Onde altero minha senha ou configuro a impressão digital/PIN?',
    answer: 'Acesse a aba "Meu Perfil" (clicando no seu nome ou avatar no topo/menu). Lá você encontra dois módulos dedicados: "Bloqueio Biométrico & PIN", para exigir digital ou código PIN de 4 dígitos ao abrir o app, e "Segurança & Alteração de Senha", para atualizar sua senha de acesso informando a senha atual.',
    category: 'configuracoes',
    tags: ['senha', 'biometria', 'digital', 'pin', 'seguranca', 'perfil'],
  },
];
