import { Account, CreditCard, Category, Transaction, Budget, Goal, Debt, InvestmentAsset, FamilyMember } from '../types';
import { DEFAULT_CATEGORIES } from './defaultCategories';

export interface FullDemoStore {
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  investments: InvestmentAsset[];
  familyMembers: FamilyMember[];
  userProfile?: {
    name: string;
    email: string;
    phone: string;
    currency: string;
  };
}

export function generateRealisticDemoStore(): FullDemoStore {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${year}-${month}`;

  // Helper date generators for current and relative months
  const getDateInCurrentMonth = (day: number) => `${year}-${month}-${String(day).padStart(2, '0')}`;
  
  const getOffsetMonthPrefix = (offset: number) => {
    const d = new Date(year, now.getMonth() + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // 1. ACCOUNTS (Contas Bancárias)
  const accounts: Account[] = [
    {
      id: 'acc-demo-nubank',
      name: 'Nubank Conta',
      type: 'checking',
      balance: 4850.00,
      initialBalance: 2000.00,
      institution: 'Nubank',
      color: '#820ad1',
      includeInTotal: true,
    },
    {
      id: 'acc-demo-itau',
      name: 'Itaú Personnalité',
      type: 'checking',
      balance: 8920.50,
      initialBalance: 5000.00,
      institution: 'Itaú',
      color: '#ec7000',
      includeInTotal: true,
    },
    {
      id: 'acc-demo-xp',
      name: 'XP Investimentos',
      type: 'investment',
      balance: 15400.00,
      initialBalance: 10000.00,
      institution: 'XP Investimentos',
      color: '#000000',
      includeInTotal: true,
    },
    {
      id: 'acc-demo-c6',
      name: 'C6 Bank',
      type: 'checking',
      balance: 1650.00,
      initialBalance: 1000.00,
      institution: 'C6 Bank',
      color: '#242424',
      includeInTotal: true,
    },
    {
      id: 'acc-demo-carteira',
      name: 'Carteira (Dinheiro)',
      type: 'cash',
      balance: 380.00,
      initialBalance: 200.00,
      institution: 'Carteira',
      color: '#10b981',
      includeInTotal: true,
    },
  ];

  // 2. CREDIT CARDS (Cartões de Crédito)
  const cards: CreditCard[] = [
    {
      id: 'card-demo-nubank',
      name: 'Nubank Ultravioleta',
      brand: 'Mastercard',
      limit: 12000,
      closingDay: 27,
      dueDay: 1,
      color: '#820ad1',
      defaultAccountId: 'acc-demo-nubank',
    },
    {
      id: 'card-demo-itau',
      name: 'Itaú Mastercard Black',
      brand: 'Mastercard',
      limit: 25000,
      closingDay: 20,
      dueDay: 28,
      color: '#ec7000',
      defaultAccountId: 'acc-demo-itau',
    },
    {
      id: 'card-demo-c6',
      name: 'C6 Carbon Black',
      brand: 'Mastercard',
      limit: 8000,
      closingDay: 15,
      dueDay: 22,
      color: '#242424',
      defaultAccountId: 'acc-demo-c6',
    },
    {
      id: 'card-demo-inter',
      name: 'Inter Mastercard Gold',
      brand: 'Mastercard',
      limit: 5000,
      closingDay: 28,
      dueDay: 5,
      color: '#ff7a00',
      defaultAccountId: 'acc-demo-nubank',
    },
  ];

  // 3. CATEGORIES
  const categories: Category[] = DEFAULT_CATEGORIES;

  // 4. TRANSACTIONS (Despesas Fixas, Parcelamentos, Variáveis e Receitas)
  const transactions: Transaction[] = [
    // --- RECEITAS DO MÊS ---
    {
      id: 'tx-rec-salario',
      description: 'Salário Mensal Líquido',
      amount: 9800.00,
      date: getDateInCurrentMonth(5),
      type: 'income',
      status: 'completed',
      categoryId: 'cat-rec-salario',
      subcategoryId: 'sub-sal-mensal',
      accountId: 'acc-demo-itau',
      recurring: true,
      recurrenceFrequency: 'monthly',
      tags: ['salario', 'fixo'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-rec-fiis',
      description: 'Dividendos FIIs (HGLG11 / MXRF11)',
      amount: 485.00,
      date: getDateInCurrentMonth(15),
      type: 'income',
      status: 'completed',
      categoryId: 'cat-rec-investimentos',
      subcategoryId: 'sub-inv-dividendos',
      accountId: 'acc-demo-xp',
      recurring: false,
      tags: ['dividendos', 'renda_passiva'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-rec-freelance',
      description: 'Consultoria Web / Projeto React',
      amount: 1750.00,
      date: getDateInCurrentMonth(18),
      type: 'income',
      status: 'completed',
      categoryId: 'cat-rec-freelance',
      accountId: 'acc-demo-nubank',
      recurring: false,
      tags: ['extra', 'freelance'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-rec-cashback',
      description: 'Cashback Cartão Ultravioleta',
      amount: 62.40,
      date: getDateInCurrentMonth(22),
      type: 'income',
      status: 'completed',
      categoryId: 'cat-rec-outras',
      accountId: 'acc-demo-nubank',
      recurring: false,
      tags: ['cashback'],
      createdAt: new Date().toISOString(),
    },

    // --- DESPESAS FIXAS REPETIDAS EM CONTA ---
    {
      id: 'tx-desp-aluguel',
      description: 'Aluguel do Apartamento',
      amount: 2100.00,
      date: getDateInCurrentMonth(10),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-aluguel',
      accountId: 'acc-demo-itau',
      recurring: true,
      recurrenceFrequency: 'monthly',
      tags: ['fixo', 'moradia'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-condominio',
      description: 'Condomínio Residencial',
      amount: 680.00,
      date: getDateInCurrentMonth(10),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-condominio',
      accountId: 'acc-demo-itau',
      recurring: true,
      recurrenceFrequency: 'monthly',
      tags: ['fixo', 'moradia'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-energia',
      description: 'Energia Elétrica Enel',
      amount: 245.60,
      date: getDateInCurrentMonth(14),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-energia',
      accountId: 'acc-demo-nubank',
      recurring: true,
      recurrenceFrequency: 'monthly',
      tags: ['utilidades'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-internet',
      description: 'Internet Fibra 600MB',
      amount: 119.90,
      date: getDateInCurrentMonth(12),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-internet',
      accountId: 'acc-demo-nubank',
      recurring: true,
      recurrenceFrequency: 'monthly',
      tags: ['internet'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-saude',
      description: 'Plano de Saúde Unimed',
      amount: 480.00,
      date: getDateInCurrentMonth(15),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-saude',
      subcategoryId: 'sub-sau-plano',
      accountId: 'acc-demo-itau',
      recurring: true,
      recurrenceFrequency: 'monthly',
      tags: ['saude'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-academia',
      description: 'Academia Smart Fit Black',
      amount: 129.90,
      date: getDateInCurrentMonth(8),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-saude',
      subcategoryId: 'sub-sau-academia',
      cardId: 'card-demo-nubank',
      recurring: true,
      recurrenceFrequency: 'monthly',
      tags: ['academia'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-streamings',
      description: 'Assinaturas (Netflix + Spotify + iCloud)',
      amount: 89.70,
      date: getDateInCurrentMonth(3),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-lazer',
      cardId: 'card-demo-nubank',
      recurring: true,
      recurrenceFrequency: 'monthly',
      tags: ['streaming'],
      createdAt: new Date().toISOString(),
    },

    // --- PARCELAMENTOS ATIVOS NO CARTÃO (MÊS ATUAL + FUTUROS) ---
    // 1. MacBook Pro M3 (10 parcelas de R$ 849.90 - Parcela 3 no mês atual)
    ...Array.from({ length: 10 }).map((_, idx) => {
      const pNum = idx + 1;
      const mOffset = idx - 2;
      const pMonth = getOffsetMonthPrefix(mOffset);
      const isPastOrCurrent = mOffset <= 0;

      return {
        id: `tx-parc-macbook-p${pNum}`,
        description: `MacBook Pro M3 Apple Store (${pNum}/10)`,
        amount: 849.90,
        date: `${pMonth}-15`,
        type: 'expense' as const,
        status: (isPastOrCurrent ? 'completed' : 'pending') as 'completed' | 'pending',
        categoryId: 'cat-desp-tecnologia',
        cardId: 'card-demo-nubank',
        recurring: false,
        installments: { current: pNum, total: 10 },
        tags: ['parcelado', 'apple', 'trabalho'],
        createdAt: new Date().toISOString(),
      };
    }),

    // 2. iPhone 16 Pro Max (12 parcelas de R$ 649.90 - Parcela 2 no mês atual)
    ...Array.from({ length: 12 }).map((_, idx) => {
      const pNum = idx + 1;
      const mOffset = idx - 1;
      const pMonth = getOffsetMonthPrefix(mOffset);
      const isPastOrCurrent = mOffset <= 0;

      return {
        id: `tx-parc-iphone-p${pNum}`,
        description: `iPhone 16 Pro Max Titanium (${pNum}/12)`,
        amount: 649.90,
        date: `${pMonth}-10`,
        type: 'expense' as const,
        status: (isPastOrCurrent ? 'completed' : 'pending') as 'completed' | 'pending',
        categoryId: 'cat-desp-tecnologia',
        cardId: 'card-demo-itau',
        recurring: false,
        installments: { current: pNum, total: 12 },
        tags: ['parcelado', 'iphone'],
        createdAt: new Date().toISOString(),
      };
    }),

    // 3. Passagens Aéreas Férias (6 parcelas de R$ 416.50 - Parcela 1 no mês atual)
    ...Array.from({ length: 6 }).map((_, idx) => {
      const pNum = idx + 1;
      const mOffset = idx;
      const pMonth = getOffsetMonthPrefix(mOffset);
      const isPastOrCurrent = mOffset <= 0;

      return {
        id: `tx-parc-passagens-p${pNum}`,
        description: `Passagens Aéreas Férias Europa (${pNum}/6)`,
        amount: 416.50,
        date: `${pMonth}-08`,
        type: 'expense' as const,
        status: (isPastOrCurrent ? 'completed' : 'pending') as 'completed' | 'pending',
        categoryId: 'cat-desp-viagens',
        cardId: 'card-demo-c6',
        recurring: false,
        installments: { current: pNum, total: 6 },
        tags: ['viagem', 'ferias'],
        createdAt: new Date().toISOString(),
      };
    }),

    // 4. Jogo de 4 Pneus Michelin (5 parcelas de R$ 320.00 - Parcela 4 no mês atual)
    ...Array.from({ length: 5 }).map((_, idx) => {
      const pNum = idx + 1;
      const mOffset = idx - 3;
      const pMonth = getOffsetMonthPrefix(mOffset);
      const isPastOrCurrent = mOffset <= 0;

      return {
        id: `tx-parc-pneus-p${pNum}`,
        description: `Pneus Michelin Carro (${pNum}/5)`,
        amount: 320.00,
        date: `${pMonth}-18`,
        type: 'expense' as const,
        status: (isPastOrCurrent ? 'completed' : 'pending') as 'completed' | 'pending',
        categoryId: 'cat-desp-transporte',
        cardId: 'card-demo-nubank',
        recurring: false,
        installments: { current: pNum, total: 5 },
        tags: ['carro', 'manutencao'],
        createdAt: new Date().toISOString(),
      };
    }),

    // --- DESPESAS VARIÁVEIS DO DIA A DIA NO MÊS ATUAL ---
    {
      id: 'tx-desp-mercado-1',
      description: 'Supermercado Pão de Açúcar',
      amount: 465.80,
      date: getDateInCurrentMonth(4),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-alimentacao',
      subcategoryId: 'sub-alim-mercado',
      cardId: 'card-demo-nubank',
      recurring: false,
      tags: ['mercado', 'casa'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-mercado-2',
      description: 'Supermercado e Açougue',
      amount: 320.40,
      date: getDateInCurrentMonth(16),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-alimentacao',
      subcategoryId: 'sub-alim-mercado',
      cardId: 'card-demo-nubank',
      recurring: false,
      tags: ['mercado'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-posto-1',
      description: 'Combustível Posto Ipiranga',
      amount: 240.00,
      date: getDateInCurrentMonth(7),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-transporte',
      subcategoryId: 'sub-tra-combustivel',
      cardId: 'card-demo-c6',
      recurring: false,
      tags: ['combustivel'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-posto-2',
      description: 'Combustível Posto Shell',
      amount: 215.00,
      date: getDateInCurrentMonth(21),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-transporte',
      subcategoryId: 'sub-tra-combustivel',
      cardId: 'card-demo-c6',
      recurring: false,
      tags: ['combustivel'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-restaurante',
      description: 'Jantar Restaurante Coco Bambu',
      amount: 195.00,
      date: getDateInCurrentMonth(11),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-alimentacao',
      subcategoryId: 'sub-alim-restaurante',
      cardId: 'card-demo-itau',
      recurring: false,
      tags: ['lazer', 'jantar'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-farmacia',
      description: 'Farmácia Drogasil (Vitaminas)',
      amount: 84.50,
      date: getDateInCurrentMonth(13),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-saude',
      subcategoryId: 'sub-sau-medicamentos',
      accountId: 'acc-demo-nubank',
      recurring: false,
      tags: ['farmacia'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-uber-1',
      description: 'Uber Corridas da Semana',
      amount: 42.90,
      date: getDateInCurrentMonth(9),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-transporte',
      subcategoryId: 'sub-tra-app',
      cardId: 'card-demo-nubank',
      recurring: false,
      tags: ['transporte', 'uber'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-feira',
      description: 'Feira Livre e Hortifruti',
      amount: 78.00,
      date: getDateInCurrentMonth(14),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-alimentacao',
      subcategoryId: 'sub-alim-hortifruti',
      accountId: 'acc-demo-carteira',
      recurring: false,
      tags: ['feira'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-almoco',
      description: 'Almoço Executivo Trabalho',
      amount: 45.00,
      date: getDateInCurrentMonth(17),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-alimentacao',
      subcategoryId: 'sub-alim-restaurante',
      accountId: 'acc-demo-nubank',
      recurring: false,
      tags: ['almoco'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-desp-padaria',
      description: 'Padaria e Café da Manhã',
      amount: 26.50,
      date: getDateInCurrentMonth(19),
      type: 'expense',
      status: 'completed',
      categoryId: 'cat-desp-alimentacao',
      subcategoryId: 'sub-alim-padaria',
      accountId: 'acc-demo-carteira',
      recurring: false,
      tags: ['cafe'],
      createdAt: new Date().toISOString(),
    },
  ];

  // 5. BUDGETS (Orçamentos por Categoria)
  const budgets: Budget[] = [
    {
      id: 'bud-alim',
      categoryId: 'cat-desp-alimentacao',
      limit: 1800.00,
      month: currentMonthPrefix,
    },
    {
      id: 'bud-moradia',
      categoryId: 'cat-desp-moradia',
      limit: 3400.00,
      month: currentMonthPrefix,
    },
    {
      id: 'bud-transporte',
      categoryId: 'cat-desp-transporte',
      limit: 1200.00,
      month: currentMonthPrefix,
    },
    {
      id: 'bud-lazer',
      categoryId: 'cat-desp-lazer',
      limit: 800.00,
      month: currentMonthPrefix,
    },
    {
      id: 'bud-saude',
      categoryId: 'cat-desp-saude',
      limit: 900.00,
      month: currentMonthPrefix,
    },
    {
      id: 'bud-tecnologia',
      categoryId: 'cat-desp-tecnologia',
      limit: 2000.00,
      month: currentMonthPrefix,
    },
  ];

  // 6. METAS FINANCEIRAS (Goals)
  const goals: Goal[] = [
    {
      id: 'goal-reserva-emergencia',
      title: 'Reserva de Emergência (6 Meses)',
      targetAmount: 35000.00,
      currentAmount: 21000.00,
      deadline: '2026-12-31',
      icon: '🛡️',
      color: '#10b981',
      completed: false,
      deposits: [
        { id: 'dep-1', amount: 15000.00, date: `${year}-01-15`, note: 'Aporte Inicial de Poupança' },
        { id: 'dep-2', amount: 3000.00, date: `${year}-02-10`, note: 'Sobra do 13º' },
        { id: 'dep-3', amount: 3000.00, date: getDateInCurrentMonth(5), note: 'Aporte Mensal Recorrente' },
      ],
    },
    {
      id: 'goal-viagem-europa',
      title: 'Férias Europa 2027',
      targetAmount: 20000.00,
      currentAmount: 8500.00,
      deadline: '2027-07-31',
      icon: '✈️',
      color: '#3b82f6',
      completed: false,
      deposits: [
        { id: 'dep-v1', amount: 5000.00, date: `${year}-01-20`, note: 'Início do Planejamento' },
        { id: 'dep-v2', amount: 3500.00, date: getDateInCurrentMonth(10), note: 'Freelance Design' },
      ],
    },
    {
      id: 'goal-troca-carro',
      title: 'Troca de Carro (SUV Novo)',
      targetAmount: 50000.00,
      currentAmount: 16000.00,
      deadline: '2028-06-30',
      icon: '🚗',
      color: '#7c4dff',
      completed: false,
      deposits: [
        { id: 'dep-c1', amount: 16000.00, date: `${year}-02-01`, note: 'Entrada reservada' },
      ],
    },
    {
      id: 'goal-imovel-proprio',
      title: 'Entrada Apartamento Próprio',
      targetAmount: 80000.00,
      currentAmount: 32000.00,
      deadline: '2028-12-31',
      icon: '🏠',
      color: '#f59e0b',
      completed: false,
      deposits: [
        { id: 'dep-i1', amount: 32000.00, date: `${year}-01-05`, note: 'Reserva FGTS + Investimentos' },
      ],
    },
  ];

  // 7. DÍVIDAS E FINANCIAMENTOS (Debts)
  const debts: Debt[] = [
    {
      id: 'debt-financiamento-caixa',
      title: 'Financiamento Imobiliário Caixa',
      creditor: 'Caixa Econômica Federal',
      totalAmount: 180000.00,
      remainingAmount: 164000.00,
      interestRate: 9.5,
      totalInstallments: 360,
      paidInstallments: 24,
      installmentAmount: 1480.00,
      dueDay: 15,
      nextDueDate: getDateInCurrentMonth(15),
      payments: [
        { id: 'pay-d1', amount: 1480.00, date: getDateInCurrentMonth(15), installmentNumber: 24 }
      ]
    },
    {
      id: 'debt-consorcio-auto',
      title: 'Consórcio Veículo Porto Seguro',
      creditor: 'Porto Seguro Consórcios',
      totalAmount: 40000.00,
      remainingAmount: 22000.00,
      interestRate: 0,
      totalInstallments: 60,
      paidInstallments: 27,
      installmentAmount: 780.00,
      dueDay: 20,
      nextDueDate: getDateInCurrentMonth(20),
      payments: [
        { id: 'pay-d2', amount: 780.00, date: getDateInCurrentMonth(20), installmentNumber: 27 }
      ]
    }
  ];

  // 8. INVESTIMENTOS (Investment Assets)
  const investments: InvestmentAsset[] = [
    {
      id: 'inv-tesouro-ipca',
      name: 'Tesouro IPCA+ 2035',
      ticker: 'IPCA2035',
      type: 'fixed',
      institution: 'XP Investimentos',
      investedAmount: 12500.00,
      currentBalance: 13850.00,
      monthlyYield: 112.50,
      yieldPercentage: 10.8,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-fii-hglg',
      name: 'CSHG Logística FII',
      ticker: 'HGLG11',
      type: 'fiis',
      institution: 'XP Investimentos',
      investedAmount: 8000.00,
      currentBalance: 8620.00,
      monthlyYield: 78.40,
      yieldPercentage: 7.75,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'inv-cdb-cdi',
      name: 'CDB 110% do CDI Liquidez Diária',
      ticker: 'CDB-NUBANK',
      type: 'fixed',
      institution: 'Nubank',
      investedAmount: 9900.00,
      currentBalance: 10450.00,
      monthlyYield: 98.20,
      yieldPercentage: 5.55,
      updatedAt: new Date().toISOString(),
    },
  ];

  // 9. FAMILY MEMBERS
  const familyMembers: FamilyMember[] = [
    {
      id: 'mem-demo-owner',
      name: 'Usuário Demonstração',
      email: 'demo@finly.com',
      phone: '11999998888',
      role: 'admin',
      status: 'active',
      isOwner: true,
      type: 'linked',
      joinedAt: '01/01/2026',
    },
    {
      id: 'mem-demo-partner',
      name: 'Mariana Demo',
      email: 'mariana.demo@finly.com',
      phone: '11988887777',
      role: 'editor',
      status: 'active',
      isOwner: false,
      type: 'linked',
      joinedAt: '15/01/2026',
    },
  ];

  return {
    accounts,
    cards,
    categories,
    transactions,
    budgets,
    goals,
    debts,
    investments,
    familyMembers,
    userProfile: {
      name: 'Usuário Demonstração',
      email: 'demo@finly.com',
      phone: '(11) 99999-8888',
      currency: 'BRL',
    },
  };
}
