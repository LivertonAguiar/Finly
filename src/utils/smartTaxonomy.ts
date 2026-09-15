import {
  FinancialNature,
  TransactionCharacteristics,
  TransactionRelationships,
  TransactionType,
} from '../types';

export interface SmartTaxonomyInferenceInput {
  description?: string;
  amount?: number;
  type?: TransactionType | string;
  categoryId?: string;
  subcategoryId?: string;
  isRecurring?: boolean;
}

export interface SmartTaxonomyInferenceResult {
  financialNature: FinancialNature;
  characteristics: TransactionCharacteristics;
  suggestedRelationships?: Partial<TransactionRelationships>;
}

export interface TaxonomyOptionConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  badge?: string;
}

/**
 * Metadados amigáveis para as 15 Naturezas Financeiras
 */
export const FINANCIAL_NATURE_CONFIG: Record<FinancialNature, TaxonomyOptionConfig> = {
  expense: {
    id: 'expense',
    label: 'Despesa Corrente',
    icon: '🔴',
    color: '#ef4444',
    description: 'Consumo padrão de produtos, serviços do dia a dia e utilidades',
    badge: 'Consumo',
  },
  income: {
    id: 'income',
    label: 'Receita / Renda',
    icon: '🟢',
    color: '#10b981',
    description: 'Salário, prestação de serviços, renda real que ingressa no patrimônio',
    badge: 'Renda',
  },
  transfer: {
    id: 'transfer',
    label: 'Transferência Neutra',
    icon: '🔄',
    color: '#64748b',
    description: 'Movimentação interna entre contas ou cartões próprios sem afetar o patrimônio',
    badge: 'Neutro',
  },
  amortization: {
    id: 'amortization',
    label: 'Amortização de Dívida',
    icon: '📉',
    color: '#3b82f6',
    description: 'Abate diretamente o saldo devedor principal de financiamento ou empréstimo',
    badge: 'Patrimonial',
  },
  interest_paid: {
    id: 'interest_paid',
    label: 'Juros Pagos',
    icon: '📈',
    color: '#f59e0b',
    description: 'Custo do capital tomado emprestado (juros de financiamento, cheque especial, etc.)',
    badge: 'Custo Capital',
  },
  penalty_fee: {
    id: 'penalty_fee',
    label: 'Multa ou Encargo',
    icon: '⚠️',
    color: '#dc2626',
    description: 'Penalidade por atraso, mora, infração de trânsito ou descumprimento contratual',
    badge: 'Encargo',
  },
  financial_fee: {
    id: 'financial_fee',
    label: 'Tarifa Financeira',
    icon: '🏦',
    color: '#6b7280',
    description: 'Tarifas de manutenção de conta, anuidade de cartão, TED/DOC, taxas operacionais',
    badge: 'Tarifa',
  },
  insurance: {
    id: 'insurance',
    label: 'Seguro / Proteção',
    icon: '🛡️',
    color: '#0284c7',
    description: 'Prêmio para proteção de patrimônio ou pessoas (Seguro Auto, Habitacional, Vida)',
    badge: 'Proteção',
  },
  tax: {
    id: 'tax',
    label: 'Imposto / Tributo',
    icon: '🧾',
    color: '#8b5cf6',
    description: 'Tributo compulsório governamental (IPTU, IPVA, IR, ITBI, taxas municipais/estaduais)',
    badge: 'Tributo',
  },
  investment_deposit: {
    id: 'investment_deposit',
    label: 'Aporte em Investimento',
    icon: '🐷',
    color: '#0d9488',
    description: 'Saída do saldo bancário líquido para aplicação em ativo financeiro (CDB, Ações, FIIs)',
    badge: 'Aporte',
  },
  investment_yield: {
    id: 'investment_yield',
    label: 'Rendimento / Dividendo',
    icon: '💰',
    color: '#16a34a',
    description: 'Proventos, cupons, juros sobre capital e lucros gerados por investimentos',
    badge: 'Provento',
  },
  investment_withdrawal: {
    id: 'investment_withdrawal',
    label: 'Resgate de Aplicação',
    icon: '💵',
    color: '#059669',
    description: 'Retorno de capital investido para a conta corrente para liquidez',
    badge: 'Resgate',
  },
  reimbursement_inflow: {
    id: 'reimbursement_inflow',
    label: 'Reembolso Recebido',
    icon: '↩️',
    color: '#0891b2',
    description: 'Devolução de valor adiantado para terceiros ou empresa (não infla renda real)',
    badge: 'Compensação',
  },
  chargeback_outflow: {
    id: 'chargeback_outflow',
    label: 'Estorno / Devolução',
    icon: '🔙',
    color: '#ea580c',
    description: 'Devolução de valor recebido indevidamente ou estorno de cobrança',
    badge: 'Ajuste',
  },
  monetary_correction: {
    id: 'monetary_correction',
    label: 'Ajuste Monetário / TR / IPCA',
    icon: '💱',
    color: '#4f46e5',
    description: 'Atualização de saldo devedor ou de investimento por índices oficiais de inflação',
    badge: 'Índice',
  },
};

/**
 * Metadados para Classificação de Necessidade (50-30-20)
 */
export const NECESSITY_CONFIG = {
  essential: {
    id: 'essential',
    label: 'Essencial (Necessidade Básica)',
    shortLabel: 'Essencial',
    icon: '🛡️',
    color: '#3b82f6',
    description: 'Gastos vitais para sobrevivência e segurança: moradia, comida, saúde, transporte básico',
  },
  discretionary: {
    id: 'discretionary',
    label: 'Estilo de Vida (Desejos / Supérfluo)',
    shortLabel: 'Estilo de Vida',
    icon: '✨',
    color: '#f59e0b',
    description: 'Conforto, lazer, restaurantes, compras e entretenimento que podem ser cortados se necessário',
  },
  strategic: {
    id: 'strategic',
    label: 'Estratégico (Futuro / Patrimônio)',
    shortLabel: 'Estratégico',
    icon: '🎯',
    color: '#10b981',
    description: 'Educação, livros, capacitação profissional, investimentos e amortização de dívidas',
  },
};

/**
 * Metadados para Escopo do Gasto
 */
export const SCOPE_CONFIG = {
  personal: {
    id: 'personal',
    label: 'Pessoal',
    icon: '👤',
    description: 'Gasto individual particular',
  },
  professional: {
    id: 'professional',
    label: 'Profissional / Trabalho',
    icon: '💼',
    description: 'Despesa ou receita ligada à profissão, trabalho ou empresa',
  },
  shared: {
    id: 'shared',
    label: 'Familiar / Compartilhado',
    icon: '👥',
    description: 'Conta compartilhada com família, cônjuge ou terceiros',
  },
};

const SUBSCRIPTION_KEYWORDS = [
  'netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'max', 'hbo',
  'apple', 'chatgpt', 'openai', 'midjourney', 'github', 'icloud', 'google one',
  'academia', 'gympass', 'totalpass', 'smart fit', 'sem parar', 'veloe', 'conectcar',
  'globo play', 'deezer', 'youtube premium', 'crunchyroll', 'kindle unlimited',
  'paramount', 'star+', 'duolingo', 'notion', 'canva', 'cursor', 'claude pro'
];

const normalizeStr = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Motor de inferência ortogonal e Smart Defaults.
 * Determina automaticamente a natureza financeira e características a partir
 * do texto da descrição, categoria e subcategoria.
 */
export function inferSmartTaxonomy(input: SmartTaxonomyInferenceInput): SmartTaxonomyInferenceResult {
  const desc = normalizeStr(input.description || '');
  const catId = normalizeStr(input.categoryId || '');
  const subId = normalizeStr(input.subcategoryId || '');
  const rawType = input.type || 'expense';

  // 1. Inferência de Natureza Financeira
  let inferredNature: FinancialNature = 'expense';

  if (rawType === 'income') {
    if (
      desc.includes('reembolso') ||
      desc.includes('devolucao') ||
      desc.includes('estorno') ||
      subId.includes('reembolso')
    ) {
      inferredNature = 'reimbursement_inflow';
    } else if (
      desc.includes('dividendo') ||
      desc.includes('provento') ||
      desc.includes('rendimento') ||
      subId.includes('dividendos') ||
      subId.includes('renda-fixa') ||
      catId.includes('investimentos')
    ) {
      inferredNature = 'investment_yield';
    } else if (
      desc.includes('resgate') ||
      desc.includes('saque poupanca')
    ) {
      inferredNature = 'investment_withdrawal';
    } else {
      inferredNature = 'income';
    }
  } else if (rawType === 'transfer') {
    if (
      desc.includes('aporte') ||
      desc.includes('investimento') ||
      catId.includes('invest')
    ) {
      inferredNature = 'investment_deposit';
    } else {
      inferredNature = 'transfer';
    }
  } else {
    // Expense
    if (
      desc.includes('seguro') ||
      desc.includes('sinistro') ||
      desc.includes('apolice') ||
      desc.includes('porto seguro') ||
      desc.includes('azul seguros') ||
      subId.includes('seguro')
    ) {
      inferredNature = 'insurance';
    } else if (
      desc.includes('iptu') ||
      desc.includes('ipva') ||
      desc.includes('darf') ||
      desc.includes('itbi') ||
      desc.includes('imposto de renda') ||
      desc.includes('tributo') ||
      desc.includes('taxa de lixo') ||
      catId.includes('impostos') ||
      subId.includes('imp-')
    ) {
      inferredNature = 'tax';
    } else if (
      desc.includes('tarifa') ||
      desc.includes('anuidade') ||
      desc.includes('taxa bancaria') ||
      desc.includes('ted') ||
      desc.includes('doc') ||
      desc.includes('iof') ||
      subId.includes('tarifas')
    ) {
      inferredNature = 'financial_fee';
    } else if (
      desc.includes('multa de transito') ||
      desc.includes('multa') ||
      desc.includes('juros de mora') ||
      desc.includes('encargos por atraso') ||
      subId.includes('multas')
    ) {
      inferredNature = 'penalty_fee';
    } else if (
      desc.includes('amortizacao') ||
      desc.includes('abatimento saldo') ||
      subId.includes('amortizacao')
    ) {
      inferredNature = 'amortization';
    } else if (
      desc.includes('juros') ||
      desc.includes('encargos financiamento') ||
      subId.includes('juros')
    ) {
      inferredNature = 'interest_paid';
    } else if (
      desc.includes('estorno') ||
      desc.includes('devolucao cliente')
    ) {
      inferredNature = 'chargeback_outflow';
    } else {
      inferredNature = 'expense';
    }
  }

  // 2. Inferência de Assinatura (Subscription)
  const isSubKeyword = SUBSCRIPTION_KEYWORDS.some(kw => desc.includes(kw));
  const isSubCategory =
    subId.includes('streaming') ||
    subId.includes('clubes-assinaturas') ||
    subId.includes('software') ||
    subId.includes('plano-cel') ||
    subId.includes('academia');

  const isSubscription = isSubKeyword || isSubCategory;

  // 3. Inferência de Necessidade (Essential vs Discretionary vs Strategic)
  let necessity: 'essential' | 'discretionary' | 'strategic' = 'discretionary';

  const isEssentialCategory =
    catId.includes('alimentacao') ||
    catId.includes('moradia') ||
    catId.includes('saude') ||
    subId.includes('mercado') ||
    subId.includes('feira') ||
    subId.includes('aluguel') ||
    subId.includes('condominio') ||
    subId.includes('energia') ||
    subId.includes('agua') ||
    subId.includes('gas') ||
    subId.includes('internet') ||
    subId.includes('farmacia') ||
    subId.includes('plano') ||
    subId.includes('combustivel') ||
    subId.includes('publico') ||
    inferredNature === 'tax';

  const isStrategicCategory =
    catId.includes('educacao') ||
    catId.includes('investimentos') ||
    subId.includes('cursos') ||
    subId.includes('livros') ||
    inferredNature === 'amortization' ||
    inferredNature === 'investment_deposit';

  if (isStrategicCategory) {
    necessity = 'strategic';
  } else if (isEssentialCategory) {
    // Se for restaurante, delivery ou supérfluo, reclassifica para estilo de vida
    if (subId.includes('restaurante') || subId.includes('delivery') || subId.includes('cafe')) {
      necessity = 'discretionary';
    } else {
      necessity = 'essential';
    }
  } else {
    necessity = 'discretionary';
  }

  // 4. Inferência de Dedutibilidade no IR
  let taxStatus: 'deductible' | 'non_deductible' | 'review_required' = 'non_deductible';
  if (
    catId.includes('saude') ||
    subId.includes('plano') ||
    subId.includes('consultas') ||
    subId.includes('exames') ||
    subId.includes('odonto') ||
    subId.includes('escola') ||
    desc.includes('consulta medica') ||
    desc.includes('dentista') ||
    desc.includes('psicolog') ||
    desc.includes('fisioterap') ||
    desc.includes('unimed') ||
    desc.includes('bradesco saude') ||
    desc.includes('sulamerica') ||
    desc.includes('colegio') ||
    desc.includes('faculdade')
  ) {
    taxStatus = 'deductible';
  }

  // 5. Variabilidade
  let variability: 'fixed' | 'variable' | 'eventual' = 'variable';
  if (
    isSubscription ||
    subId.includes('aluguel') ||
    subId.includes('condominio') ||
    subId.includes('internet') ||
    subId.includes('plano') ||
    subId.includes('escola')
  ) {
    variability = 'fixed';
  } else if (
    inferredNature === 'tax' ||
    subId.includes('manutencao') ||
    subId.includes('viagens') ||
    subId.includes('presentes')
  ) {
    variability = 'eventual';
  }

  // 6. Monta Objeto de Características
  const characteristics: TransactionCharacteristics = {
    recurrence: {
      enabled: Boolean(input.isRecurring || isSubscription),
      isSubscription,
      variability,
    },
    necessity,
    scope: 'personal',
    taxStatus,
    reimbursement: {
      isReimbursable: inferredNature === 'reimbursement_inflow',
      status: inferredNature === 'reimbursement_inflow' ? 'settled' : 'none',
    },
    debtControl: {
      isExtraordinaryAmortization: inferredNature === 'amortization' && desc.includes('extraordinaria'),
    },
  };

  return {
    financialNature: inferredNature,
    characteristics,
  };
}
