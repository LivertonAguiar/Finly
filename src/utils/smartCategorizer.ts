import { Category, Transaction, TransactionType } from '../types';

const LEARNED_RULES_KEY = 'finly_category_learned_rules';

// Pre-built Brazilian keyword to category mapper
interface KeywordRule {
  keywords: string[];
  categoryType: 'expense' | 'income';
  categoryMatcher: string[]; // keywords to match category name (e.g. 'alimentacao', 'transporte')
}

const BUILT_IN_RULES: KeywordRule[] = [
  {
    keywords: [
      'uber', '99app', '99 pop', '99 taxi', 'cabify', 'posto', 'gasolina', 'combustivel',
      'ipiranga', 'shell', 'br distribuidora', 'estacionamento', 'estapar', 'pedagio',
      'sem parar', 'conectcar', 'veloe', 'metro', 'onibus', 'bilhete unico', 'recarga bilhete',
      'passagem aerea', 'gol', 'latam', 'azul linhas'
    ],
    categoryType: 'expense',
    categoryMatcher: ['transporte', 'veiculo', 'automovel', 'viagem'],
  },
  {
    keywords: [
      'ifood', 'rappi', 'restaurante', 'padaria', 'mercado', 'supermercado', 'carrefour',
      'pao de acucar', 'atacadao', 'assai', 'acougue', 'hortifruti', 'mcdonald', 'burger king',
      'subway', 'habib', 'churrascaria', 'pizzaria', 'cafe', 'starbucks', 'bar', 'chopp',
      'sorveteria', 'doceria', 'confeitaria', 'lanche', 'delivery', 'comida'
    ],
    categoryType: 'expense',
    categoryMatcher: ['alimentacao', 'refeicao', 'restaurante', 'comida'],
  },
  {
    keywords: [
      'aluguel', 'condominio', 'iptu', 'enel', 'luz', 'energia', 'sabesp', 'agua',
      'cagece', 'copasa', 'sanepar', 'gas', 'ultragaz', 'supergasbras', 'internet',
      'claro residencial', 'vivo fibra', 'oi fibra', 'limpeza', 'diarista'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
  },
  {
    keywords: [
      'netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'max', 'paramount',
      'globoplay', 'youtube', 'cinema', 'ingresso', 'steam', 'playstation', 'psn',
      'xbox', 'nintendo', 'show', 'teatro', 'sympla', 'eventim', 'jogos'
    ],
    categoryType: 'expense',
    categoryMatcher: ['lazer', 'entretenimento', 'assinatura'],
  },
  {
    keywords: [
      'farmacia', 'drogaria', 'drogasil', 'droga raia', 'pague menos', 'panvel',
      'consulta', 'medico', 'hospital', 'laboratorio', 'dentista', 'unimed',
      'bradesco saude', 'sulamerica', 'otica', 'psicologo', 'exame', 'terapia',
      'remedio', 'medicamento'
    ],
    categoryType: 'expense',
    categoryMatcher: ['saude', 'medico', 'farmacia'],
  },
  {
    keywords: [
      'faculdade', 'universidade', 'escola', 'colegio', 'curso', 'udemy', 'alura',
      'idiomas', 'ingles', 'mensalidade escolar', 'livraria', 'livro', 'material escolar'
    ],
    categoryType: 'expense',
    categoryMatcher: ['educacao', 'estudos', 'cursos'],
  },
  {
    keywords: [
      'amazon', 'mercado livre', 'shopee', 'aliexpress', 'shein', 'magalu',
      'magazine luiza', 'casas bahia', 'zara', 'renner', 'riachuelo', 'c&a',
      'kabum', 'pichau', 'perfumaria', 'boticario', 'sephora', 'cabelo', 'barbearia',
      'salao', 'roupa', 'calcado', 'eletronico'
    ],
    categoryType: 'expense',
    categoryMatcher: ['compras', 'pessoal', 'vestuario', 'cuidados'],
  },
  {
    keywords: [
      'salario', 'prolabore', 'pro-labore', 'rendimento', 'ted recebida',
      'pix recebido', 'transferencia recebida', 'dividendos', 'jcp', 'reembolso',
      'bonificacao', 'comissao', 'freelance', 'pagamento cliente', 'venda'
    ],
    categoryType: 'income',
    categoryMatcher: ['salario', 'receita', 'rendimento', 'pro-labore'],
  },
];

/**
 * Normalizes text for comparison (lowercase, removes accents, strips punctuation)
 */
export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

/**
 * Loads learned keyword -> category rules from localStorage
 */
function getLearnedRules(): Record<string, string> {
  try {
    const saved = localStorage.getItem(LEARNED_RULES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {};
}

/**
 * Trains the categorizer from the user's historical transactions.
 * Associates recurring description keywords with selected categories.
 */
export function trainFromHistory(transactions: Transaction[]): void {
  if (!transactions || transactions.length === 0) return;

  const keywordCounts: Record<string, Record<string, number>> = {};

  transactions.forEach(t => {
    if (!t.categoryId || t.categoryId === 'outros' || t.categoryId.startsWith('cat-transfer')) return;

    const normalizedDesc = normalizeText(t.description);
    const tokens = normalizedDesc.split(/\s+/).filter(tok => tok.length >= 3);

    tokens.forEach(tok => {
      if (!keywordCounts[tok]) keywordCounts[tok] = {};
      keywordCounts[tok][t.categoryId] = (keywordCounts[tok][t.categoryId] || 0) + 1;
    });
  });

  const learnedRules: Record<string, string> = getLearnedRules();

  // Pick categories with strong confidence (> 2 occurrences and > 60% agreement)
  Object.entries(keywordCounts).forEach(([token, catMap]) => {
    let bestCat = '';
    let maxCount = 0;
    let totalCount = 0;

    Object.entries(catMap).forEach(([catId, count]) => {
      totalCount += count;
      if (count > maxCount) {
        maxCount = count;
        bestCat = catId;
      }
    });

    if (maxCount >= 2 && maxCount / totalCount >= 0.6) {
      learnedRules[token] = bestCat;
    }
  });

  try {
    localStorage.setItem(LEARNED_RULES_KEY, JSON.stringify(learnedRules));
  } catch (e) {}
}

export interface PredictionResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
  source: 'history' | 'dictionary';
}

/**
 * Predicts the most suitable category for a given transaction description
 */
export function predictCategory(
  description: string,
  txType: TransactionType,
  categories: Category[],
  historicalTransactions?: Transaction[]
): PredictionResult | null {
  const normDesc = normalizeText(description);
  if (!normDesc || normDesc.length < 2) return null;

  const typeCategories = categories.filter(c => c.type === (txType === 'income' ? 'income' : 'expense'));
  if (typeCategories.length === 0) return null;

  // 1. Check Learned Rules from History
  const learnedRules = getLearnedRules();
  const tokens = normDesc.split(/\s+/);

  for (const token of tokens) {
    if (token.length >= 3 && learnedRules[token]) {
      const targetCatId = learnedRules[token];
      const match = typeCategories.find(c => c.id === targetCatId);
      if (match) {
        return {
          categoryId: match.id,
          categoryName: match.name,
          confidence: 0.95,
          source: 'history',
        };
      }
    }
  }

  // 2. Check Recent Historical Transactions (Direct substring matching)
  if (historicalTransactions && historicalTransactions.length > 0) {
    const directMatch = historicalTransactions.find(t => {
      if (t.type !== txType || !t.categoryId) return false;
      const hNorm = normalizeText(t.description);
      return hNorm === normDesc || normDesc.includes(hNorm) || hNorm.includes(normDesc);
    });

    if (directMatch) {
      const match = typeCategories.find(c => c.id === directMatch.categoryId);
      if (match) {
        return {
          categoryId: match.id,
          categoryName: match.name,
          confidence: 0.9,
          source: 'history',
        };
      }
    }
  }

  // 3. Check Built-in Dictionary
  for (const rule of BUILT_IN_RULES) {
    if (rule.categoryType !== txType && !(txType === 'expense' && rule.categoryType === 'expense')) continue;

    const matchedKeyword = rule.keywords.find(kw => normDesc.includes(kw));
    if (matchedKeyword) {
      // Find matching category in the user's category list
      const matchedCategory = typeCategories.find(c => {
        const normCatName = normalizeText(c.name);
        return rule.categoryMatcher.some(m => normCatName.includes(m));
      });

      if (matchedCategory) {
        return {
          categoryId: matchedCategory.id,
          categoryName: matchedCategory.name,
          confidence: 0.85,
          source: 'dictionary',
        };
      }
    }
  }

  return null;
}
