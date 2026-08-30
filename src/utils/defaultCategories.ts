import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Despesas
  {
    id: 'cat-alimentacao',
    name: 'Alimentação',
    icon: '🍽️',
    color: '#f97316',
    type: 'expense',
    subcategories: [
      { id: 'sub-mercado', name: 'Mercado / Supermercado', icon: '🛒', categoryId: 'cat-alimentacao' },
      { id: 'sub-restaurante', name: 'Restaurante / Delivery', icon: '🍕', categoryId: 'cat-alimentacao' },
      { id: 'sub-lanches', name: 'Café / Lanches', icon: '☕', categoryId: 'cat-alimentacao' },
      { id: 'sub-padaria', name: 'Padaria / Feira', icon: '🥖', categoryId: 'cat-alimentacao' },
    ]
  },
  {
    id: 'cat-moradia',
    name: 'Moradia / Casa',
    icon: '🏠',
    color: '#3b82f6',
    type: 'expense',
    subcategories: [
      { id: 'sub-aluguel', name: 'Aluguel / Condomínio', icon: '🏢', categoryId: 'cat-moradia' },
      { id: 'sub-energia', name: 'Energia Elétrica', icon: '⚡', categoryId: 'cat-moradia' },
      { id: 'sub-agua', name: 'Água e Esgoto', icon: '🚰', categoryId: 'cat-moradia' },
      { id: 'sub-internet', name: 'Internet / Telefone', icon: '📶', categoryId: 'cat-moradia' },
      { id: 'sub-manutencao', name: 'Manutenção / Móveis', icon: '🛠️', categoryId: 'cat-moradia' },
    ]
  },
  {
    id: 'cat-transporte',
    name: 'Transporte',
    icon: '🚗',
    color: '#8b5cf6',
    type: 'expense',
    subcategories: [
      { id: 'sub-combustivel', name: 'Combustível', icon: '⛽', categoryId: 'cat-transporte' },
      { id: 'sub-aplicativos', name: 'Uber / 99 / Táxi', icon: '🚕', categoryId: 'cat-transporte' },
      { id: 'sub-estacionamento', name: 'Estacionamento / Pedágio', icon: '🅿️', categoryId: 'cat-transporte' },
      { id: 'sub-seguro-auto', name: 'Seguro / IPVA / Manutenção', icon: '🔧', categoryId: 'cat-transporte' },
      { id: 'sub-publico', name: 'Transporte Público', icon: '🚌', categoryId: 'cat-transporte' },
    ]
  },
  {
    id: 'cat-saude',
    name: 'Saúde e Cuidados',
    icon: '💊',
    color: '#ef4444',
    type: 'expense',
    subcategories: [
      { id: 'sub-farmacia', name: 'Farmácia / Remédios', icon: '💉', categoryId: 'cat-saude' },
      { id: 'sub-plano-saude', name: 'Plano de Saúde', icon: '🏥', categoryId: 'cat-saude' },
      { id: 'sub-consultas', name: 'Consultas / Exames', icon: '🩺', categoryId: 'cat-saude' },
      { id: 'sub-academia', name: 'Academia / Esportes', icon: '🏋️', categoryId: 'cat-saude' },
      { id: 'sub-higiene', name: 'Higiene e Beleza', icon: '🧴', categoryId: 'cat-saude' },
    ]
  },
  {
    id: 'cat-lazer',
    name: 'Lazer e Entretenimento',
    icon: '🎮',
    color: '#ec4899',
    type: 'expense',
    subcategories: [
      { id: 'sub-streaming', name: 'Assinaturas / Streaming', icon: '📺', categoryId: 'cat-lazer' },
      { id: 'sub-passeios', name: 'Cinema / Shows / Festas', icon: '🎟️', categoryId: 'cat-lazer' },
      { id: 'sub-viagens', name: 'Viagens / Hospedagem', icon: '✈️', categoryId: 'cat-lazer' },
      { id: 'sub-jogos', name: 'Jogos / Hobbies', icon: '🎲', categoryId: 'cat-lazer' },
    ]
  },
  {
    id: 'cat-educacao',
    name: 'Educação',
    icon: '🎓',
    color: '#10b981',
    type: 'expense',
    subcategories: [
      { id: 'sub-mensalidade', name: 'Faculdade / Escola', icon: '🏫', categoryId: 'cat-educacao' },
      { id: 'sub-cursos', name: 'Cursos / Treinamentos', icon: '💻', categoryId: 'cat-educacao' },
      { id: 'sub-livros', name: 'Livros / Papelaria', icon: '📚', categoryId: 'cat-educacao' },
    ]
  },
  {
    id: 'cat-pets',
    name: 'Pets',
    icon: '🐶',
    color: '#eab308',
    type: 'expense',
    subcategories: [
      { id: 'sub-racao', name: 'Ração e Petiscos', icon: '🥩', categoryId: 'cat-pets' },
      { id: 'sub-vet', name: 'Veterinário / Vacinas', icon: '🩺', categoryId: 'cat-pets' },
      { id: 'sub-banho', name: 'Banho e Tosa', icon: '✂️', categoryId: 'cat-pets' },
    ]
  },
  {
    id: 'cat-financas-desp',
    name: 'Juros e Tarifas',
    icon: '💸',
    color: '#64748b',
    type: 'expense',
    subcategories: [
      { id: 'sub-juros', name: 'Juros e Multas', icon: '⚠️', categoryId: 'cat-financas-desp' },
      { id: 'sub-tarifas', name: 'Tarifas Bancárias', icon: '🏦', categoryId: 'cat-financas-desp' },
      { id: 'sub-impostos', name: 'Impostos e Tributos', icon: '📄', categoryId: 'cat-financas-desp' },
    ]
  },

  // Receitas
  {
    id: 'cat-salario',
    name: 'Salário & Renda Principal',
    icon: '💰',
    color: '#10b981',
    type: 'income',
    subcategories: [
      { id: 'sub-salario-mensal', name: 'Salário Fixo', icon: '💼', categoryId: 'cat-salario' },
      { id: 'sub-adiantamento', name: 'Adiantamento / 13º', icon: '💵', categoryId: 'cat-salario' },
      { id: 'sub-ferias', name: 'Férias / Bônus', icon: '🏖️', categoryId: 'cat-salario' },
    ]
  },
  {
    id: 'cat-renda-extra',
    name: 'Renda Extra & Freelance',
    icon: '🪙',
    color: '#06b6d4',
    type: 'income',
    subcategories: [
      { id: 'sub-freelance', name: 'Projetos Freelance', icon: '💻', categoryId: 'cat-renda-extra' },
      { id: 'sub-vendas', name: 'Venda de Produtos', icon: '📦', categoryId: 'cat-renda-extra' },
      { id: 'sub-servicos', name: 'Prestação de Serviços', icon: '🛠️', categoryId: 'cat-renda-extra' },
    ]
  },
  {
    id: 'cat-rendimentos',
    name: 'Investimentos & Rendimentos',
    icon: '📈',
    color: '#6366f1',
    type: 'income',
    subcategories: [
      { id: 'sub-dividendos', name: 'Dividendos / JCP', icon: '📊', categoryId: 'cat-rendimentos' },
      { id: 'sub-renda-fixa', name: 'Rendimento Renda Fixa', icon: '🏦', categoryId: 'cat-rendimentos' },
      { id: 'sub-aluguel-rec', name: 'Renda de Aluguéis', icon: '🏠', categoryId: 'cat-rendimentos' },
    ]
  },
  {
    id: 'cat-outras-rec',
    name: 'Outras Receitas',
    icon: '🎁',
    color: '#a855f7',
    type: 'income',
    subcategories: [
      { id: 'sub-presente', name: 'Presentes / Prêmios', icon: '🎉', categoryId: 'cat-outras-rec' },
      { id: 'sub-reembolso', name: 'Reembolsos', icon: '↩️', categoryId: 'cat-outras-rec' },
      { id: 'sub-cashback', name: 'Cashback e Recompensas', icon: '💳', categoryId: 'cat-outras-rec' },
    ]
  }
];

export const EMOJI_GROUPS: { name: string; emojis: string[] }[] = [
  { name: 'Alimentação', emojis: ['🍽️', '🛒', '🍕', '☕', '🥖', '🍔', '🍎', '🥩', '🍰', '🍺', '🍷', '🍣', '🍿', '🥤', '🍦', '🍩', '🥑', '🍳', '🌮', '🍫', '🍜'] },
  { name: 'Transporte', emojis: ['🚗', '⛽', '🚕', '🚌', '🚆', '🚲', '🛵', '✈️', '🚢', '🅿️', '🔧', '🚦', '🚖', '🛴', '🚁', '🚤', '🏎️', '🏍️', '🚂', '🚇', '🚜'] },
  { name: 'Casa & Moradia', emojis: ['🏠', '🏢', '⚡', '🚰', '📶', '🛠️', '🛋️', '🧹', '🔑', '🪴', '💡', '📺', '🛏️', '🛁', '🚪', '🏡', '🏗️', '🪑', '🚿', '🧺', '📦'] },
  { name: 'Saúde & Cuidados', emojis: ['💊', '🏥', '🩺', '💉', '🏋️', '🧴', '🦷', '👓', '🧘', '🩹', '🏃', '🚿', '💅', '💈', '🩻', '🚑', '🩸', '🧼', '🚴', '🏊', '🤾'] },
  { name: 'Lazer & Hobbies', emojis: ['🎮', '🎟️', '🎲', '🏖️', '🎧', '🎸', '⚽', '🎨', '📚', '⛺', '🎯', '🎬', '🎳', '⛵', '🎤', '🎪', '🎹', '🏆', '🎿', '🎣', '🛹'] },
  { name: 'Finanças & Trabalho', emojis: ['💰', '💵', '💳', '🏦', '📈', '🪙', '💼', '💻', '📊', '💸', '💎', '🧾', '🏷️', '📦', '🏧', '📉', '💲', '🗂️', '📁', '🖋️'] },
  { name: 'Educação & Livros', emojis: ['🎓', '🏫', '📚', '💻', '📝', '📖', '✏️', '🔬', '🎨', '🌐', '📐', '🧠', '🎒', '📜', '🖊️', '🧪', '🔭', '🏛️', '💡', '📌'] },
  { name: 'Animais & Natureza', emojis: ['🐶', '🐱', '🐾', '🥩', '✂️', '🦜', '🐠', '🐎', '🌸', '🌿', '🌲', '🌻', '🍁', '🍀', '🐰', '🦁', '🐹', '🐢', '🐬', '🪴', '🌴'] },
  { name: 'Símbolos & Emoções', emojis: ['⭐', '❤️', '🔥', '⚡', '🎉', '🎁', '⚠️', '✅', '❌', '🔔', '🔒', '💡', '🏆', '🎯', '🚀', '🌟', '💯', '✨', '🌈', '🛡️', '💎'] },
];
