import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STORES_DIR = path.join(DATA_DIR, 'stores');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STORES_DIR)) fs.mkdirSync(STORES_DIR, { recursive: true });

// 1. Ensure Demo User in users.json
let users = [];
try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  }
} catch (e) {
  users = [];
}

const DEMO_USER_ID = 'usr-demo-financeiro';
const DEMO_EMAIL = 'demo@finly.com';

const demoUserIndex = users.findIndex(u => u.id === DEMO_USER_ID || u.email.toLowerCase() === DEMO_EMAIL);

const demoUserData = {
  id: DEMO_USER_ID,
  name: 'Conta Demonstração',
  email: DEMO_EMAIL,
  phone: '11999998888',
  role: 'admin',
  createdAt: '2026-01-01',
};

if (demoUserIndex >= 0) {
  users[demoUserIndex] = { ...users[demoUserIndex], ...demoUserData };
} else {
  users.push({ ...demoUserData, password: 'demo' });
}

fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

// 2. Generate Store Data for usr-demo-financeiro.json
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const currentMonthPrefix = `${year}-${month}`;

const getDateInCurrentMonth = (day) => `${year}-${month}-${String(day).padStart(2, '0')}`;
const getDateInOffsetMonth = (offset, day) => {
  const target = new Date(year, now.getMonth() + offset + 1, 0);
  const safeDay = Math.min(day, target.getDate());
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
};

const getOffsetMonthPrefix = (offset) => {
  const d = new Date(year, now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const accounts = [
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

const cards = [
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

let categories = [];
try {
  const categorySources = [
    path.join(STORES_DIR, `${DEMO_USER_ID}.json`),
    path.join(STORES_DIR, 'usr-default-liverton.json'),
  ];
  for (const source of categorySources) {
    if (!fs.existsSync(source)) continue;
    const raw = JSON.parse(fs.readFileSync(source, 'utf8'));
    if (Array.isArray(raw.categories) && raw.categories.length > 0) {
      categories = raw.categories;
      break;
    }
  }
} catch (e) {}

const transactions = [
  // Receitas
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

  // Despesas Fixas em Conta
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

  // Parcelamentos no Cartão
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
      type: 'expense',
      status: isPastOrCurrent ? 'completed' : 'pending',
      categoryId: 'cat-desp-compras-pessoal',
      subcategoryId: 'sub-comp-informatica',
      cardId: 'card-demo-nubank',
      recurring: false,
      installments: { current: pNum, total: 10 },
      tags: ['parcelado', 'apple', 'trabalho'],
      createdAt: new Date().toISOString(),
    };
  }),

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
      type: 'expense',
      status: isPastOrCurrent ? 'completed' : 'pending',
      categoryId: 'cat-desp-compras-pessoal',
      subcategoryId: 'sub-comp-celular',
      cardId: 'card-demo-itau',
      recurring: false,
      installments: { current: pNum, total: 12 },
      tags: ['parcelado', 'iphone'],
      createdAt: new Date().toISOString(),
    };
  }),

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
      type: 'expense',
      status: isPastOrCurrent ? 'completed' : 'pending',
      categoryId: 'cat-desp-lazer',
      subcategoryId: 'sub-lazer-viagens',
      cardId: 'card-demo-c6',
      recurring: false,
      installments: { current: pNum, total: 6 },
      tags: ['viagem', 'ferias'],
      createdAt: new Date().toISOString(),
    };
  }),

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
      type: 'expense',
      status: isPastOrCurrent ? 'completed' : 'pending',
      categoryId: 'cat-desp-transporte',
      cardId: 'card-demo-nubank',
      recurring: false,
      installments: { current: pNum, total: 5 },
      tags: ['carro', 'manutencao'],
      createdAt: new Date().toISOString(),
    };
  }),

  // Despesas Variáveis
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

const budgets = [
  { id: 'bud-alim', categoryId: 'cat-desp-alimentacao', limit: 1800.00, month: currentMonthPrefix },
  { id: 'bud-moradia', categoryId: 'cat-desp-moradia', limit: 3400.00, month: currentMonthPrefix },
  { id: 'bud-transporte', categoryId: 'cat-desp-transporte', limit: 1200.00, month: currentMonthPrefix },
  { id: 'bud-lazer', categoryId: 'cat-desp-lazer', limit: 800.00, month: currentMonthPrefix },
  { id: 'bud-saude', categoryId: 'cat-desp-saude', limit: 900.00, month: currentMonthPrefix },
  { id: 'bud-compras-pessoal', categoryId: 'cat-desp-compras-pessoal', limit: 2000.00, month: currentMonthPrefix },
];

const goals = [
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

const debts = [
  {
    id: 'debt-financiamento-caixa',
    title: 'Financiamento Imobiliário Caixa',
    creditor: 'Caixa Econômica Federal',
    contractType: 'real_estate',
    contractNumber: 'CAIXA-SFH-2024-001',
    totalAmount: 180000.00,
    remainingAmount: 164000.00,
    interestRate: 9.5,
    amortizationSystem: 'SAC',
    indexer: 'TR',
    indexerRate: 0.1708,
    insuranceMonthly: 38.50,
    adminFeeMonthly: 25.00,
    totalInstallments: 360,
    paidInstallments: 24,
    installmentAmount: 1480.00,
    dueDay: 15,
    nextDueDate: getDateInCurrentMonth(15),
    defaultAccountId: 'acc-demo-itau',
    syncToTransactions: true,
    payments: [
      { id: 'pay-d1', amount: 1480.00, date: getDateInCurrentMonth(15), installmentNumber: 24 }
    ]
  },
  {
    id: 'debt-consorcio-auto',
    title: 'Consórcio Veículo Porto Seguro',
    creditor: 'Porto Seguro Consórcios',
    contractType: 'vehicle',
    contractNumber: 'PORTO-AUTO-2023-027',
    totalAmount: 40000.00,
    remainingAmount: 22000.00,
    interestRate: 0,
    amortizationSystem: 'PRICE',
    indexer: 'FIXED',
    indexerRate: 0,
    insuranceMonthly: 0,
    adminFeeMonthly: 0,
    totalInstallments: 60,
    paidInstallments: 27,
    installmentAmount: 780.00,
    dueDay: 20,
    nextDueDate: getDateInCurrentMonth(20),
    defaultAccountId: 'acc-demo-nubank',
    syncToTransactions: true,
    payments: [
      { id: 'pay-d2', amount: 780.00, date: getDateInCurrentMonth(20), installmentNumber: 27 }
    ]
  }
];

debts.forEach(debt => {
  const remainingInstallments = Math.min(12, debt.totalInstallments - debt.paidInstallments);
  for (let offset = 0; offset < remainingInstallments; offset++) {
    const installmentNumber = debt.paidInstallments + offset + 1;
    const dueDate = getDateInOffsetMonth(offset, debt.dueDay);
    const isRealEstate = debt.contractType === 'real_estate';
    transactions.push({
      id: `tx-debt-${debt.id}-${installmentNumber}`,
      description: `${debt.title} (${installmentNumber}/${debt.totalInstallments})`,
      amount: debt.installmentAmount,
      type: 'expense',
      date: dueDate,
      dueDate,
      categoryId: isRealEstate ? 'cat-desp-moradia' : 'cat-desp-transporte',
      subcategoryId: isRealEstate ? 'sub-mor-financiamento-apto' : 'sub-trans-financiamento',
      accountId: debt.defaultAccountId,
      status: 'pending',
      recurring: false,
      installments: { current: installmentNumber, total: debt.totalInstallments },
      debtId: debt.id,
      debtInstallmentNumber: installmentNumber,
      tags: ['financiamento', 'parcela'],
      notes: debt.contractNumber ? `Contrato nº ${debt.contractNumber}` : undefined,
      createdAt: now.toISOString(),
    });
  }
});

const investments = [
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

const familyMembers = [
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

const demoStorePath = path.join(STORES_DIR, `${DEMO_USER_ID}.json`);

const demoFullStore = {
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
    name: 'Conta Demonstração',
    email: DEMO_EMAIL,
    phone: '(11) 99999-8888',
    currency: 'BRL',
  },
  _serverTimestamp: new Date().toISOString(),
};

fs.writeFileSync(demoStorePath, JSON.stringify(demoFullStore, null, 2), 'utf8');
console.log(`✅ Conta Demo isolada criada/atualizada com sucesso!`);
console.log(`📁 Arquivo: ${demoStorePath}`);
console.log(`👤 E-mail: ${DEMO_EMAIL} | Senha: demo`);
