import { Category, Transaction, TransactionType } from '../types';

const LEARNED_RULES_KEY = 'finly_category_learned_rules';
const LEARNED_SUBS_KEY = 'finly_subcategory_learned_rules';

// Pre-built Brazilian keyword to category & subcategory mapper with default contextual tags
export interface KeywordRule {
  keywords: string[];
  categoryType: 'expense' | 'income';
  categoryMatcher: string[]; // keywords to match category name (e.g. 'alimentacao', 'transporte')
  subcategoryMatcher?: string[]; // keywords to match subcategory name (e.g. 'uber', 'mercado', 'aluguel')
  defaultTags?: string[]; // contextual tags to suggest
}

export const BUILT_IN_RULES: KeywordRule[] = [
  // TRANSPORTE
  {
    keywords: [
      'uber', '99app', '99 pop', '99 taxi', 'cabify', 'corrida app', 'indrive'
    ],
    categoryType: 'expense',
    categoryMatcher: ['transporte', 'veiculo', 'automovel'],
    subcategoryMatcher: ['uber', 'app', 'aplicativo', 'taxi'],
    defaultTags: ['transporte', 'uber', 'corrida'],
  },
  {
    keywords: [
      'posto', 'gasolina', 'combustivel', 'etanol', 'alcool', 'diesel',
      'ipiranga', 'shell', 'br distribuidora', 'vibra', 'abastecimento'
    ],
    categoryType: 'expense',
    categoryMatcher: ['transporte', 'veiculo'],
    subcategoryMatcher: ['combustivel'],
    defaultTags: ['combustivel', 'carro', 'transporte'],
  },
  {
    keywords: [
      'estacionamento', 'estapar', 'zona azul', 'pare bem', 'garagem',
      'pedagio', 'sem parar', 'conectcar', 'veloe', 'tag pedagio'
    ],
    categoryType: 'expense',
    categoryMatcher: ['transporte', 'veiculo'],
    subcategoryMatcher: ['estacionamento', 'pedagio'],
    defaultTags: ['carro', 'estacionamento', 'pedagio'],
  },
  {
    keywords: [
      'metro', 'onibus', 'bilhete unico', 'recarga bilhete', 'passagem onibus', 'cptm', 'vlt'
    ],
    categoryType: 'expense',
    categoryMatcher: ['transporte'],
    subcategoryMatcher: ['transporte publico', 'onibus', 'metro'],
    defaultTags: ['transporte', 'mobilidade'],
  },
  {
    keywords: [
      'oficina', 'mecanico', 'troca de oleo', 'pneu', 'borracharia', 'revisao carro', 'funilaria'
    ],
    categoryType: 'expense',
    categoryMatcher: ['transporte', 'veiculo'],
    subcategoryMatcher: ['manutencao', 'seguro / ipva / manutencao', 'revisao'],
    defaultTags: ['carro', 'manutencao'],
  },

  // ALIMENTAÇÃO
  {
    keywords: [
      'ifood', 'rappi', 'aiqfome', 'delivery', 'mcdonald', 'burger king', 'habib', 'subway',
      'pizzaria', 'hamburgueria', 'lanche', 'pastel', 'sushi', 'acai', 'doceria'
    ],
    categoryType: 'expense',
    categoryMatcher: ['alimentacao', 'refeicao', 'comida'],
    subcategoryMatcher: ['delivery', 'lanches', 'fast food', 'restaurante'],
    defaultTags: ['delivery', 'refeicao', 'ifood', 'lanche'],
  },
  {
    keywords: [
      'mercado', 'supermercado', 'carrefour', 'pao de acucar', 'atacadao', 'assai',
      'hortifruti', 'acougue', 'peixaria', 'sacolao', 'feira', 'varejao'
    ],
    categoryType: 'expense',
    categoryMatcher: ['alimentacao', 'refeicao'],
    subcategoryMatcher: ['mercado', 'supermercado', 'feira'],
    defaultTags: ['mercado', 'casa', 'compras', 'alimentacao'],
  },
  {
    keywords: [
      'restaurante', 'churrascaria', 'bar', 'boteco', 'chopp', 'cerveja', 'adega',
      'cafe', 'starbucks', 'padaria', 'confeitaria', 'bistro', 'almoço executivo'
    ],
    categoryType: 'expense',
    categoryMatcher: ['alimentacao', 'refeicao'],
    subcategoryMatcher: ['restaurante', 'bares', 'cafe', 'padaria'],
    defaultTags: ['refeicao', 'almoco', 'jantar', 'lazer'],
  },

  // MORADIA
  {
    keywords: [
      'aluguel', 'locacao imovel', 'quinto andar', 'imobiliaria'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['aluguel'],
    defaultTags: ['fixo', 'moradia', 'aluguel', 'imovel'],
  },
  {
    keywords: [
      'condominio', 'taxa condominial', 'administradora condominio', 'sindico'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['condominio'],
    defaultTags: ['fixo', 'moradia', 'condominio'],
  },
  {
    keywords: [
      'enel', 'luz', 'energia eletrica', 'cpfl', 'equatorial', 'light', 'cemig', 'copel'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['energia', 'eletrica', 'luz'],
    defaultTags: ['fixo', 'contas', 'energia'],
  },
  {
    keywords: [
      'sabesp', 'agua', 'esgoto', 'sanepar', 'copasa', 'cagece', 'cedae', 'embasa'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['agua', 'esgoto'],
    defaultTags: ['fixo', 'contas', 'agua'],
  },
  {
    keywords: [
      'internet', 'vivo fibra', 'claro residencial', 'claro net', 'oi fibra', 'provedor internet'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['internet'],
    defaultTags: ['fixo', 'contas', 'internet'],
  },
  {
    keywords: [
      'limpeza', 'faxina', 'produtos de limpeza', 'lavanderia', 'omo', 'sabao em po', 'desinfetante', 'utilidades'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['limpeza & utilidades', 'limpeza', 'utilidades'],
    defaultTags: ['casa', 'limpeza', 'utilidades'],
  },
  {
    keywords: [
      'diarista', 'faxineira', 'mensalista'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['diarista', 'limpeza'],
    defaultTags: ['casa', 'diarista', 'limpeza'],
  },
  {
    keywords: [
      'manutencao casa', 'eletricista', 'encanador', 'pintor', 'reforma', 'marceneiro', 'chaveiro'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['manutencao', 'reforma'],
    defaultTags: ['casa', 'manutencao', 'reforma'],
  },
  {
    keywords: [
      'moveis', 'tok&stok', 'marabraz', 'etna', 'mobly', 'sofa', 'colchao', 'armario', 'mesa'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['moveis', 'decoracao'],
    defaultTags: ['casa', 'moveis'],
  },
  {
    keywords: [
      'eletrodomestico', 'geladeira', 'fogao', 'microondas', 'airfryer', 'aspirador', 'maquina de lavar'
    ],
    categoryType: 'expense',
    categoryMatcher: ['moradia', 'habitacao', 'casa'],
    subcategoryMatcher: ['eletro', 'eletrodomesticos'],
    defaultTags: ['casa', 'eletrodomesticos'],
  },

  // LAZER & STREAMING
  {
    keywords: [
      'netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'max', 'paramount',
      'globoplay', 'youtube premium', 'apple tv', 'deezer', 'crunchyroll'
    ],
    categoryType: 'expense',
    categoryMatcher: ['lazer', 'entretenimento'],
    subcategoryMatcher: ['assinatura', 'streaming', 'servicos online'],
    defaultTags: ['assinatura', 'streaming', 'lazer', 'recorrente'],
  },
  {
    keywords: [
      'cinema', 'ingresso', 'show', 'teatro', 'sympla', 'eventim', 'parque', 'circo', 'balada'
    ],
    categoryType: 'expense',
    categoryMatcher: ['lazer', 'entretenimento'],
    subcategoryMatcher: ['cinema', 'show', 'passeios', 'eventos'],
    defaultTags: ['lazer', 'passeio', 'ingressos', 'fim-de-semana'],
  },
  {
    keywords: [
      'steam', 'playstation', 'psn', 'xbox', 'nintendo', 'game', 'epic games', 'jogos'
    ],
    categoryType: 'expense',
    categoryMatcher: ['lazer', 'entretenimento'],
    subcategoryMatcher: ['jogos', 'games'],
    defaultTags: ['jogos', 'games', 'lazer'],
  },
  {
    keywords: [
      'viagem', 'hotel', 'airbnb', 'pousada', 'passagem aerea', 'gol', 'latam', 'azul linhas', 'booking', 'decolar'
    ],
    categoryType: 'expense',
    categoryMatcher: ['lazer', 'viagens', 'transporte'],
    subcategoryMatcher: ['viagens', 'hospedagem'],
    defaultTags: ['viagem', 'ferias', 'passeio'],
  },

  // SAÚDE
  {
    keywords: [
      'farmacia', 'drogaria', 'drogasil', 'droga raia', 'pague menos', 'panvel',
      'remedio', 'medicamento', 'ultrafarma', 'suplemento'
    ],
    categoryType: 'expense',
    categoryMatcher: ['saude'],
    subcategoryMatcher: ['farmacia', 'medicamentos'],
    defaultTags: ['saude', 'farmacia', 'medicamentos'],
  },
  {
    keywords: [
      'consulta', 'medico', 'hospital', 'laboratorio', 'dentista', 'unimed',
      'bradesco saude', 'sulamerica', 'psicologo', 'exame', 'terapia', 'fisioterapia'
    ],
    categoryType: 'expense',
    categoryMatcher: ['saude'],
    subcategoryMatcher: ['consultas', 'exames', 'plano de saude', 'dentista'],
    defaultTags: ['saude', 'medico', 'consultas'],
  },
  {
    keywords: [
      'otica', 'oculos', 'lentes', 'lente de contato', 'armacao', 'oftalmo', 'oftalmologista', 'lente'
    ],
    categoryType: 'expense',
    categoryMatcher: ['saude'],
    subcategoryMatcher: ['oculos & lentes', 'oculos', 'lentes', 'otica'],
    defaultTags: ['saude', 'oculos', 'lentes', 'otica'],
  },

  // ACADEMIA & ESPORTES
  {
    keywords: [
      'academia', 'smartfit', 'smart fit', 'bluefit', 'bodytech', 'musculacao',
      'crossfit', 'natacao', 'pilates', 'personal trainer', 'esportes'
    ],
    categoryType: 'expense',
    categoryMatcher: ['academia', 'esportes'],
    subcategoryMatcher: ['academia', 'mensalidade'],
    defaultTags: ['academia', 'treino', 'saude', 'fixo'],
  },

  // EDUCAÇÃO
  {
    keywords: [
      'faculdade', 'universidade', 'escola', 'colegio', 'curso', 'udemy', 'alura',
      'idiomas', 'ingles', 'mensalidade escolar', 'livraria', 'livro', 'material escolar'
    ],
    categoryType: 'expense',
    categoryMatcher: ['educacao', 'estudos', 'cursos'],
    subcategoryMatcher: ['cursos', 'livros', 'mensalidade'],
    defaultTags: ['educacao', 'estudos', 'curso'],
  },

  // COMPRAS & PESSOAL
  {
    keywords: [
      'amazon', 'mercado livre', 'shopee', 'aliexpress', 'shein', 'magalu',
      'magazine luiza', 'casas bahia', 'zara', 'renner', 'riachuelo', 'c&a',
      'kabum', 'pichau', 'perfumaria', 'boticario', 'sephora', 'cabelo', 'barbearia',
      'salao', 'roupa', 'calcado', 'eletronico'
    ],
    categoryType: 'expense',
    categoryMatcher: ['compras', 'pessoal', 'vestuario', 'cuidados'],
    subcategoryMatcher: ['vestuario', 'cuidados', 'eletronicos', 'compras'],
    defaultTags: ['compras', 'pessoal'],
  },

  // RECEITAS
  {
    keywords: [
      'salario', 'prolabore', 'pro-labore', 'holerite', 'adiantamento salarial',
      'ted recebida', 'folha de pagamento', 'remuneracao'
    ],
    categoryType: 'income',
    categoryMatcher: ['salario', 'trabalho', 'rendimento'],
    subcategoryMatcher: ['salario', 'mensal'],
    defaultTags: ['salario', 'trabalho', 'fixo'],
  },
  {
    keywords: [
      'freelance', 'freela', 'cliente', 'projeto', 'consultoria', 'servico prestado', 'nota fiscal'
    ],
    categoryType: 'income',
    categoryMatcher: ['trabalho', 'freelance'],
    subcategoryMatcher: ['freelance', 'servicos'],
    defaultTags: ['freelance', 'extra', 'trabalho', 'cliente'],
  },
  {
    keywords: [
      'dividendos', 'jcp', 'rendimentos', 'renda passiva', 'proventos', 'fii', 'acoes'
    ],
    categoryType: 'income',
    categoryMatcher: ['investimentos', 'rendas passivas'],
    subcategoryMatcher: ['dividendos', 'rendimentos'],
    defaultTags: ['investimentos', 'renda-passiva', 'dividendos'],
  },
  {
    keywords: [
      'reembolso', 'devolucao', 'estorno', 'cashback', 'bonificacao', 'premio'
    ],
    categoryType: 'income',
    categoryMatcher: ['beneficios', 'outros', 'reembolsos'],
    subcategoryMatcher: ['reembolso', 'outras receitas'],
    defaultTags: ['reembolso', 'extra'],
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
 * Normalizes a single tag: converts to lower case, removes accents/diacritics
 * while preserving the base letter (e.g., "óculos" -> "oculos", "alimentação" -> "alimentacao"),
 * removes leading #, converts spaces to hyphens, strips unwanted punctuation, and limits length.
 */
export function normalizeTag(tag: string): string {
  if (!tag) return '';
  return tag
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
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
 * Loads learned keyword -> subcategory rules from localStorage
 */
function getLearnedSubRules(): Record<string, string> {
  try {
    const saved = localStorage.getItem(LEARNED_SUBS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {};
}

/**
 * Trains the categorizer from the user's historical transactions.
 * Associates recurring description keywords with selected categories and subcategories.
 */
export function trainFromHistory(transactions: Transaction[]): void {
  if (!transactions || transactions.length === 0) return;

  const keywordCounts: Record<string, Record<string, number>> = {};
  const subKeywordCounts: Record<string, Record<string, number>> = {};

  transactions.forEach(t => {
    if (!t.categoryId || t.categoryId === 'outros' || t.categoryId.startsWith('cat-transfer')) return;

    const normalizedDesc = normalizeText(t.description);
    const tokens = normalizedDesc.split(/\s+/).filter(tok => tok.length >= 3);

    tokens.forEach(tok => {
      if (!keywordCounts[tok]) keywordCounts[tok] = {};
      keywordCounts[tok][t.categoryId] = (keywordCounts[tok][t.categoryId] || 0) + 1;

      if (t.subcategoryId) {
        if (!subKeywordCounts[tok]) subKeywordCounts[tok] = {};
        subKeywordCounts[tok][t.subcategoryId] = (subKeywordCounts[tok][t.subcategoryId] || 0) + 1;
      }
    });
  });

  const learnedRules: Record<string, string> = getLearnedRules();
  const learnedSubRules: Record<string, string> = getLearnedSubRules();

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

  // Pick subcategories with strong confidence
  Object.entries(subKeywordCounts).forEach(([token, subMap]) => {
    let bestSub = '';
    let maxCount = 0;
    let totalCount = 0;

    Object.entries(subMap).forEach(([subId, count]) => {
      totalCount += count;
      if (count > maxCount) {
        maxCount = count;
        bestSub = subId;
      }
    });

    if (maxCount >= 2 && maxCount / totalCount >= 0.6) {
      learnedSubRules[token] = bestSub;
    }
  });

  try {
    localStorage.setItem(LEARNED_RULES_KEY, JSON.stringify(learnedRules));
    localStorage.setItem(LEARNED_SUBS_KEY, JSON.stringify(learnedSubRules));
  } catch (e) {}
}

export interface PredictionResult {
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  confidence: number;
  source: 'history' | 'dictionary';
  suggestedTags?: string[];
}

/**
 * Predicts both Category and Subcategory for a given transaction description.
 * Prioritizes historical exact & token matches, then built-in rules.
 */
export function predictCategoryAndSubcategory(
  description: string,
  txType: TransactionType,
  categories: Category[],
  historicalTransactions?: Transaction[]
): PredictionResult | null {
  const normDesc = normalizeText(description);
  if (!normDesc || normDesc.length < 2) return null;

  const typeCategories = categories.filter(c => c.type === (txType === 'income' ? 'income' : 'expense'));
  if (typeCategories.length === 0) return null;

  // Helper to find category and subcategory safely
  const findCategoryAndSub = (catId?: string, subId?: string) => {
    if (!catId) return null;
    const cat = typeCategories.find(c => c.id === catId);
    if (!cat) return null;
    const sub = subId && Array.isArray(cat.subcategories)
      ? cat.subcategories.find(s => s.id === subId)
      : undefined;
    return { cat, sub };
  };

  // 1. Direct Substring or Significant Token Match in User's Historical Transactions
  if (historicalTransactions && historicalTransactions.length > 0) {
    let bestHistoryTx: Transaction | undefined = historicalTransactions.find(t => {
      if (t.type !== txType || !t.categoryId) return false;
      const hNorm = normalizeText(t.description);
      return hNorm === normDesc || normDesc.includes(hNorm) || hNorm.includes(normDesc);
    });

    if (!bestHistoryTx && normDesc.length >= 3) {
      const descTokens = normDesc.split(/\s+/).filter(t => t.length >= 3);
      if (descTokens.length > 0) {
        let maxOverlap = 0;
        for (const t of historicalTransactions) {
          if (t.type !== txType || !t.categoryId) continue;
          const hNorm = normalizeText(t.description);
          let overlap = 0;
          for (const tok of descTokens) {
            if (hNorm.includes(tok)) overlap++;
          }
          if (overlap >= 2 && overlap > maxOverlap) {
            maxOverlap = overlap;
            bestHistoryTx = t;
          }
        }
      }
    }

    if (bestHistoryTx) {
      const resolved = findCategoryAndSub(bestHistoryTx.categoryId, bestHistoryTx.subcategoryId);
      if (resolved) {
        return {
          categoryId: resolved.cat.id,
          categoryName: resolved.cat.name,
          subcategoryId: resolved.sub?.id,
          subcategoryName: resolved.sub?.name,
          confidence: 0.95,
          source: 'history',
          suggestedTags: Array.isArray(bestHistoryTx.tags) ? bestHistoryTx.tags.map(normalizeTag).filter(Boolean) : undefined,
        };
      }
    }
  }

  // 2. Learned Rules from Tokens (from history training)
  const learnedRules = getLearnedRules();
  const learnedSubRules = getLearnedSubRules();
  const tokens = normDesc.split(/\s+/);

  for (const token of tokens) {
    if (token.length >= 3 && learnedRules[token]) {
      const targetCatId = learnedRules[token];
      const targetSubId = learnedSubRules[token];
      const resolved = findCategoryAndSub(targetCatId, targetSubId);
      if (resolved) {
        return {
          categoryId: resolved.cat.id,
          categoryName: resolved.cat.name,
          subcategoryId: resolved.sub?.id,
          subcategoryName: resolved.sub?.name,
          confidence: 0.90,
          source: 'history',
        };
      }
    }
  }

  // 3. Built-in Dictionary with Subcategory Matcher
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
        // Find matching subcategory if available
        let matchedSub = undefined;
        if (rule.subcategoryMatcher && Array.isArray(matchedCategory.subcategories)) {
          for (const sm of rule.subcategoryMatcher) {
            const found = matchedCategory.subcategories.find(s => {
              const normSubName = normalizeText(s.name);
              return normSubName.includes(sm) || sm.includes(normSubName);
            });
            if (found) {
              matchedSub = found;
              break;
            }
          }
        }

        return {
          categoryId: matchedCategory.id,
          categoryName: matchedCategory.name,
          subcategoryId: matchedSub?.id,
          subcategoryName: matchedSub?.name,
          confidence: 0.85,
          source: 'dictionary',
          suggestedTags: rule.defaultTags,
        };
      }
    }
  }

  return null;
}

/**
 * Backwards-compatible predictCategory (calls predictCategoryAndSubcategory).
 */
export function predictCategory(
  description: string,
  txType: TransactionType,
  categories: Category[],
  historicalTransactions?: Transaction[]
): PredictionResult | null {
  return predictCategoryAndSubcategory(description, txType, categories, historicalTransactions);
}

export interface SuggestTagsParams {
  description?: string;
  categoryId?: string;
  subcategoryId?: string;
  type?: TransactionType;
  isCard?: boolean;
  isThirdParty?: boolean;
  historicalTransactions?: Transaction[];
  currentTags?: string[];
  limit?: number;
}

/**
 * Generates dynamic, ranked tag suggestions based on:
 * 1. Historical co-occurrence with description keywords (highest score)
 * 2. Historical affinity with the selected subcategory & category
 * 3. Contextual tags from built-in rules (e.g. 'uber', 'limpeza', 'mercado')
 * 4. Transaction operational context ('terceiros', 'parcelado', 'fixo')
 * 5. General most frequent tags from the user's past transactions
 */
export function suggestDynamicTags({
  description = '',
  categoryId,
  subcategoryId,
  type = 'expense',
  isCard = false,
  isThirdParty = false,
  historicalTransactions = [],
  currentTags = [],
  limit = 6,
}: SuggestTagsParams): string[] {
  const normDesc = normalizeText(description);
  const descTokens = normDesc.split(/\s+/).filter(t => t.length >= 3);
  const normalizedCurrent = new Set((currentTags || []).map(normalizeTag).filter(Boolean));

  // Score accumulator: tag -> score
  const scores = new Map<string, number>();

  const addScore = (rawTag: string, points: number) => {
    const clean = normalizeTag(rawTag);
    if (!clean || normalizedCurrent.has(clean)) return;
    scores.set(clean, (scores.get(clean) || 0) + points);
  };

  // 1. Contextual flags
  if (isThirdParty) {
    addScore('terceiros', 25);
  }
  if (isCard) {
    addScore('cartao', 5);
  }

  // 2. Match with Built-in Dictionary Rules
  if (normDesc.length >= 2) {
    for (const rule of BUILT_IN_RULES) {
      if (rule.keywords.some(kw => normDesc.includes(kw))) {
        rule.defaultTags?.forEach(t => addScore(t, 12));
      }
    }
  }

  // 3. Scan Historical Transactions
  if (historicalTransactions && historicalTransactions.length > 0) {
    // We only inspect up to the last 200 relevant transactions for high speed
    const recentTxs = historicalTransactions.slice(0, 250);

    for (const tx of recentTxs) {
      if (!Array.isArray(tx.tags) || tx.tags.length === 0) continue;

      const txNormDesc = normalizeText(tx.description);
      const isDescMatch = normDesc.length >= 3 && (txNormDesc.includes(normDesc) || normDesc.includes(txNormDesc));

      // Token overlap count
      let tokenMatches = 0;
      if (descTokens.length > 0) {
        for (const tok of descTokens) {
          if (txNormDesc.includes(tok)) tokenMatches++;
        }
      }

      const isSubMatch = Boolean(subcategoryId && tx.subcategoryId === subcategoryId);
      const isCatMatch = Boolean(categoryId && tx.categoryId === categoryId);

      for (const t of tx.tags) {
        // High boost for description match
        if (isDescMatch) {
          addScore(t, 20);
        } else if (tokenMatches > 0) {
          addScore(t, 8 * tokenMatches);
        }

        // Subcategory match
        if (isSubMatch) {
          addScore(t, 10);
        }

        // Category match
        if (isCatMatch) {
          addScore(t, 4);
        }

        // General recency / frequency base point
        addScore(t, 1);
      }
    }
  }

  // Fallback defaults if few or no tags were scored
  if (scores.size < limit) {
    const fallbackList = ['fixo', 'casa', 'trabalho', 'refeicao', 'mercado', 'viagem', 'lazer', 'saude'];
    fallbackList.forEach(fb => addScore(fb, 0.5));
  }

  // Sort by score descending
  const sorted = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  return sorted.slice(0, limit);
}
