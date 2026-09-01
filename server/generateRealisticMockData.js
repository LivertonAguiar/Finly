import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORES_DIR = path.join(__dirname, 'data', 'stores');
if (!fs.existsSync(STORES_DIR)) fs.mkdirSync(STORES_DIR, { recursive: true });

const targetFile = path.join(STORES_DIR, 'usr-default-liverton.json');

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const currentMonthPrefix = `${year}-${month}`;

const getDateInCurrentMonth = (day) => `${year}-${month}-${String(day).padStart(2, '0')}`;

const getOffsetMonthPrefix = (offset) => {
  const d = new Date(year, now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// 1. ACCOUNTS
const accounts = [
  {
    id: 'acc-nubank',
    name: 'Nubank Conta',
    type: 'checking',
    balance: 4850.00,
    initialBalance: 2000.00,
    institution: 'Nubank',
    color: '#820ad1',
    includeInTotal: true,
  },
  {
    id: 'acc-itau',
    name: 'Itaú Personnalité',
    type: 'checking',
    balance: 8920.50,
    initialBalance: 5000.00,
    institution: 'Itaú',
    color: '#ec7000',
    includeInTotal: true,
  },
  {
    id: 'acc-xp',
    name: 'XP Investimentos',
    type: 'investment',
    balance: 15400.00,
    initialBalance: 10000.00,
    institution: 'XP Investimentos',
    color: '#000000',
    includeInTotal: true,
  },
  {
    id: 'acc-c6',
    name: 'C6 Bank',
    type: 'checking',
    balance: 1650.00,
    initialBalance: 1000.00,
    institution: 'C6 Bank',
    color: '#242424',
    includeInTotal: true,
  },
  {
    id: 'acc-carteira',
    name: 'Carteira (Dinheiro)',
    type: 'cash',
    balance: 380.00,
    initialBalance: 200.00,
    institution: 'Carteira',
    color: '#10b981',
    includeInTotal: true,
  },
];

// 2. CARDS
const cards = [
  {
    id: 'card-nubank-black',
    name: 'Nubank Ultravioleta',
    brand: 'Mastercard',
    limit: 12000,
    closingDay: 27,
    dueDay: 1,
    color: '#820ad1',
    defaultAccountId: 'acc-nubank',
  },
  {
    id: 'card-itau-black',
    name: 'Itaú Mastercard Black',
    brand: 'Mastercard',
    limit: 25000,
    closingDay: 20,
    dueDay: 28,
    color: '#ec7000',
    defaultAccountId: 'acc-itau',
  },
  {
    id: 'card-c6-carbon',
    name: 'C6 Carbon Black',
    brand: 'Mastercard',
    limit: 8000,
    closingDay: 15,
    dueDay: 22,
    color: '#242424',
    defaultAccountId: 'acc-c6',
  },
  {
    id: 'card-inter-gold',
    name: 'Inter Mastercard Gold',
    brand: 'Mastercard',
    limit: 5000,
    closingDay: 28,
    dueDay: 5,
    color: '#ff7a00',
    defaultAccountId: 'acc-nubank',
  },
];

// 3. DEFAULT CATEGORIES (loaded or preserved)
let categories = [];
try {
  const existingRaw = fs.readFileSync(targetFile, 'utf8');
  const parsed = JSON.parse(existingRaw);
  if (parsed.categories && parsed.categories.length > 0) {
    categories = parsed.categories;
  }
} catch (e) {}

// 4. TRANSACTIONS
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
    accountId: 'acc-itau',
    paymentMethod: 'account',
    isRecurring: true,
    tags: ['salario', 'fixo'],
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
    accountId: 'acc-xp',
    paymentMethod: 'account',
    tags: ['dividendos', 'renda_passiva'],
  },
  {
    id: 'tx-rec-freelance',
    description: 'Consultoria Web / Projeto React',
    amount: 1750.00,
    date: getDateInCurrentMonth(18),
    type: 'income',
    status: 'completed',
    categoryId: 'cat-rec-freelance',
    accountId: 'acc-nubank',
    paymentMethod: 'account',
    tags: ['extra', 'freelance'],
  },
  {
    id: 'tx-rec-cashback',
    description: 'Cashback Cartão Ultravioleta',
    amount: 62.40,
    date: getDateInCurrentMonth(22),
    type: 'income',
    status: 'completed',
    categoryId: 'cat-rec-outras',
    accountId: 'acc-nubank',
    paymentMethod: 'account',
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
    accountId: 'acc-itau',
    paymentMethod: 'account',
    isRecurring: true,
    tags: ['fixo', 'moradia'],
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
    accountId: 'acc-itau',
    paymentMethod: 'account',
    isRecurring: true,
    tags: ['fixo', 'moradia'],
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
    accountId: 'acc-nubank',
    paymentMethod: 'account',
    isRecurring: true,
    tags: ['utilidades'],
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
    accountId: 'acc-nubank',
    paymentMethod: 'account',
    isRecurring: true,
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
    accountId: 'acc-itau',
    paymentMethod: 'account',
    isRecurring: true,
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
    cardId: 'card-nubank-black',
    paymentMethod: 'card',
    isRecurring: true,
  },
  {
    id: 'tx-desp-streamings',
    description: 'Assinaturas (Netflix + Spotify + iCloud)',
    amount: 89.70,
    date: getDateInCurrentMonth(3),
    type: 'expense',
    status: 'completed',
    categoryId: 'cat-desp-lazer',
    cardId: 'card-nubank-black',
    paymentMethod: 'card',
    isRecurring: true,
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
      categoryId: 'cat-desp-tecnologia',
      cardId: 'card-nubank-black',
      paymentMethod: 'card',
      installments: { current: pNum, total: 10, originalAmount: 8499.00 },
      tags: ['parcelado', 'apple', 'trabalho'],
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
      categoryId: 'cat-desp-tecnologia',
      cardId: 'card-itau-black',
      paymentMethod: 'card',
      installments: { current: pNum, total: 12, originalAmount: 7798.80 },
      tags: ['parcelado', 'iphone'],
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
      categoryId: 'cat-desp-viagens',
      cardId: 'card-c6-carbon',
      paymentMethod: 'card',
      installments: { current: pNum, total: 6, originalAmount: 2499.00 },
      tags: ['viagem', 'ferias'],
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
      cardId: 'card-nubank-black',
      paymentMethod: 'card',
      installments: { current: pNum, total: 5, originalAmount: 1600.00 },
      tags: ['carro', 'manutencao'],
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
    cardId: 'card-nubank-black',
    paymentMethod: 'card',
    tags: ['mercado', 'casa'],
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
    cardId: 'card-nubank-black',
    paymentMethod: 'card',
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
    cardId: 'card-c6-carbon',
    paymentMethod: 'card',
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
    cardId: 'card-c6-carbon',
    paymentMethod: 'card',
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
    cardId: 'card-itau-black',
    paymentMethod: 'card',
    tags: ['lazer', 'jantar'],
  },
  {
    id: 'tx-desp-farmacia',
    description: 'Farmácia Drogasil (Vitaminas e Medicamentos)',
    amount: 84.50,
    date: getDateInCurrentMonth(13),
    type: 'expense',
    status: 'completed',
    categoryId: 'cat-desp-saude',
    subcategoryId: 'sub-sau-medicamentos',
    accountId: 'acc-nubank',
    paymentMethod: 'account',
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
    cardId: 'card-nubank-black',
    paymentMethod: 'card',
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
    accountId: 'acc-carteira',
    paymentMethod: 'account',
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
    accountId: 'acc-nubank',
    paymentMethod: 'account',
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
    accountId: 'acc-carteira',
    paymentMethod: 'account',
  },
];

// 5. BUDGETS
const budgets = [
  { id: 'bud-alim', categoryId: 'cat-desp-alimentacao', limit: 1800.00, month: currentMonthPrefix },
  { id: 'bud-moradia', categoryId: 'cat-desp-moradia', limit: 3400.00, month: currentMonthPrefix },
  { id: 'bud-transporte', categoryId: 'cat-desp-transporte', limit: 1200.00, month: currentMonthPrefix },
  { id: 'bud-lazer', categoryId: 'cat-desp-lazer', limit: 800.00, month: currentMonthPrefix },
  { id: 'bud-saude', categoryId: 'cat-desp-saude', limit: 900.00, month: currentMonthPrefix },
  { id: 'bud-tecnologia', categoryId: 'cat-desp-tecnologia', limit: 2000.00, month: currentMonthPrefix },
];

// 6. GOALS
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
      { id: 'dep-1', amount: 15000.00, date: `${year}-01-15`, accountId: 'acc-xp', note: 'Aporte Inicial de Poupança' },
      { id: 'dep-2', amount: 3000.00, date: `${year}-02-10`, accountId: 'acc-xp', note: 'Sobra do 13º' },
      { id: 'dep-3', amount: 3000.00, date: getDateInCurrentMonth(5), accountId: 'acc-xp', note: 'Aporte Mensal Recorrente' },
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
      { id: 'dep-v1', amount: 5000.00, date: `${year}-01-20`, accountId: 'acc-nubank', note: 'Início do Planejamento' },
      { id: 'dep-v2', amount: 3500.00, date: getDateInCurrentMonth(10), accountId: 'acc-nubank', note: 'Freelance Design' },
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
      { id: 'dep-c1', amount: 16000.00, date: `${year}-02-01`, accountId: 'acc-itau', note: 'Entrada reservada' },
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
      { id: 'dep-i1', amount: 32000.00, date: `${year}-01-05`, accountId: 'acc-xp', note: 'Reserva FGTS + Investimentos' },
    ],
  },
];

// 7. DEBTS
const debts = [
  {
    id: 'debt-financiamento-caixa',
    name: 'Financiamento Imobiliário Caixa',
    creditor: 'Caixa Econômica Federal',
    totalAmount: 180000.00,
    remainingAmount: 164000.00,
    interestRate: 9.5,
    totalInstallments: 360,
    paidInstallments: 24,
    installmentAmount: 1480.00,
    dueDay: 15,
    startDate: '2024-01-15',
    category: 'Imóvel',
    priority: 'medium',
    status: 'active',
    payments: [
      { id: 'pay-d1', amount: 1480.00, date: getDateInCurrentMonth(15), installmentNumber: 24, accountId: 'acc-itau' }
    ]
  },
  {
    id: 'debt-consorcio-auto',
    name: 'Consórcio Veículo Porto Seguro',
    creditor: 'Porto Seguro Consórcios',
    totalAmount: 40000.00,
    remainingAmount: 22000.00,
    interestRate: 0,
    totalInstallments: 60,
    paidInstallments: 27,
    installmentAmount: 780.00,
    dueDay: 20,
    startDate: '2024-03-20',
    category: 'Veículo',
    priority: 'low',
    status: 'active',
    payments: [
      { id: 'pay-d2', amount: 780.00, date: getDateInCurrentMonth(20), installmentNumber: 27, accountId: 'acc-nubank' }
    ]
  }
];

// 8. INVESTMENTS
const investments = [
  {
    id: 'inv-tesouro-ipca',
    name: 'Tesouro IPCA+ 2035',
    ticker: 'IPCA2035',
    type: 'fixed_income',
    institution: 'XP Investimentos',
    investedAmount: 12500.00,
    currentValue: 13850.00,
    monthlyYield: 112.50,
    totalReturnPercent: 10.8,
  },
  {
    id: 'inv-fii-hglg',
    name: 'CSHG Logística FII',
    ticker: 'HGLG11',
    type: 'real_estate',
    institution: 'XP Investimentos',
    investedAmount: 8000.00,
    currentValue: 8620.00,
    monthlyYield: 78.40,
    totalReturnPercent: 7.75,
  },
  {
    id: 'inv-cdb-cdi',
    name: 'CDB 110% do CDI Liquidez Diária',
    ticker: 'CDB-NUBANK',
    type: 'fixed_income',
    institution: 'Nubank',
    investedAmount: 9900.00,
    currentValue: 10450.00,
    monthlyYield: 98.20,
    totalReturnPercent: 5.55,
  },
];

// 9. FAMILY MEMBERS
const familyMembers = [
  {
    id: 'mem-owner',
    name: 'Liverton',
    email: 'liverton.aguiar@hotmail.com',
    phone: '85985949115',
    role: 'admin',
    status: 'active',
    isOwner: true,
    type: 'linked',
    joinedAt: '01/01/2026',
  },
  {
    id: 'mem-esposa',
    name: 'Camila Aguiar',
    email: 'camila.aguiar@hotmail.com',
    phone: '85999887766',
    role: 'member',
    status: 'active',
    isOwner: false,
    type: 'linked',
    joinedAt: '15/01/2026',
  },
];

const fullStore = {
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
    name: 'Liverton',
    email: 'liverton.aguiar@hotmail.com',
    phone: '(85) 98594-9115',
    currency: 'BRL',
  },
  _serverTimestamp: new Date().toISOString(),
};

fs.writeFileSync(targetFile, JSON.stringify(fullStore, null, 2), 'utf8');
console.log(`✅ Dados fictícios realistas gerados com sucesso em: ${targetFile}`);
console.log(`📊 Contas: ${accounts.length} | Cartões: ${cards.length} | Transações: ${transactions.length} | Metas: ${goals.length} | Dívidas: ${debts.length}`);
