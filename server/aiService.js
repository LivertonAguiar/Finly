/**
 * Finly Local AI Service
 * Connects to local Ollama instance on the VPS for 100% private, on-premise financial intelligence.
 */
import fs from 'node:fs';
import path from 'node:path';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

/**
 * Check if local Ollama server is reachable and what models are available
 */
export async function getAiHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return { available: false, error: `Ollama status ${res.status}` };
    }

    const data = await res.json();
    const models = (data.models || []).map(m => m.name);
    const hasDefault = models.some(m => m.includes(DEFAULT_MODEL.split(':')[0]));

    return {
      available: true,
      provider: 'ollama_local',
      host: OLLAMA_HOST,
      activeModel: DEFAULT_MODEL,
      installedModels: models,
      modelReady: hasDefault,
    };
  } catch (err) {
    return {
      available: false,
      provider: 'ollama_local',
      host: OLLAMA_HOST,
      error: err.message || 'Ollama offline',
      modelReady: false,
    };
  }
}

/**
 * Robust JSON cleaner: removes markdown code fences and trailing chars
 */
function cleanJsonText(raw) {
  if (!raw || typeof raw !== 'string') return '{}';
  let clean = raw.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/i, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return clean;
}

/**
 * Normalizes Brazilian money values into clean float number
 */
function parseMoneyValue(val) {
  if (typeof val === 'number') return Math.round(val * 100) / 100;
  if (!val || typeof val !== 'string') return 0;
  const digits = val.replace(/[^\d,.-]/g, '');
  if (digits.includes(',') && digits.includes('.')) {
    return parseFloat(digits.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (digits.includes(',')) {
    return parseFloat(digits.replace(',', '.')) || 0;
  }
  return parseFloat(digits) || 0;
}

/**
 * Extracts structured transaction details from raw text or receipt OCR text
 */
export async function extractTransactionData({ text, categories = [], accounts = [], cards = [] }) {
  if (!text || !text.trim()) {
    throw new Error('Texto ou conteúdo do comprovante não fornecido.');
  }

  const categoryNames = categories.map(c => c.name).filter(Boolean);
  const accountNames = accounts.map(a => a.name).filter(Boolean);
  const cardNames = cards.map(c => c.name).filter(Boolean);

  const systemPrompt = `Você é o assistente financeiro do Finly.
Sua missão é extrair dados estruturados de comprovantes de pagamento (Pix, cartões de crédito/débito, boletos, recibos ou mensagens de voz transcritas).
Responda APENAS em JSON estrito (sem markdown, sem explicações), seguindo este formato exato:
{
  "type": "expense" ou "income",
  "amount": number (exemplo: 49.90, nunca negativo),
  "date": "YYYY-MM-DD" (se não especificada ou incerta, use "${new Date().toISOString().split('T')[0]}"),
  "description": "Nome limpo do estabelecimento, loja ou pessoa favorecida",
  "paymentMethod": "account" ou "card",
  "suggestedCategory": "Melhor categoria correspondente",
  "suggestedSubcategory": "Subcategoria sugerida (opcional)",
  "suggestedAccountOrCard": "Nome do banco ou cartão se identificado",
  "installments": number (quantidade de parcelas se for compra parcelada, padrão 1)
}

Categorias disponíveis no app do usuário: ${categoryNames.slice(0, 25).join(', ') || 'Alimentação, Transporte, Moradia, Lazer, Saúde, Salário'}
Contas bancárias do usuário: ${accountNames.join(', ') || 'Nenhuma'}
Cartões de crédito do usuário: ${cardNames.join(', ') || 'Nenhum'}`;

  const userPrompt = `Analise o texto do lançamento/comprovante abaixo e extraia o JSON:
---
${text.trim()}
---`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for CPU inference & cold start

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        format: 'json',
        stream: false,
        keep_alive: '60m',
        options: {
          temperature: 0.1, // High determinism
          num_predict: 256, // Fast response
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama retornou status ${response.status}`);
    }

    const data = await response.json();
    const rawJson = cleanJsonText(data.response);
    const parsed = JSON.parse(rawJson);

    // Sanitize and match with user entities
    const amount = parseMoneyValue(parsed.amount);
    const cleanDate = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
      ? parsed.date
      : new Date().toISOString().split('T')[0];

    // Find closest category
    let matchedCategory = null;
    let matchedSubcategory = null;
    if (parsed.suggestedCategory) {
      const target = parsed.suggestedCategory.toLowerCase();
      matchedCategory = categories.find(c => c.name.toLowerCase().includes(target) || target.includes(c.name.toLowerCase()));
      if (matchedCategory && parsed.suggestedSubcategory && Array.isArray(matchedCategory.subcategories)) {
        const subTarget = parsed.suggestedSubcategory.toLowerCase();
        matchedSubcategory = matchedCategory.subcategories.find(s => s.name.toLowerCase().includes(subTarget) || subTarget.includes(s.name.toLowerCase()));
      }
    }

    // Find closest account or card
    let matchedAccountId = undefined;
    let matchedCardId = undefined;
    if (parsed.suggestedAccountOrCard) {
      const name = parsed.suggestedAccountOrCard.toLowerCase();
      const acc = accounts.find(a => a.name.toLowerCase().includes(name) || name.includes(a.name.toLowerCase()));
      if (acc) matchedAccountId = acc.id;
      const crd = cards.find(c => c.name.toLowerCase().includes(name) || name.includes(c.name.toLowerCase()));
      if (crd) matchedCardId = crd.id;
    }

    return {
      success: true,
      provider: 'ollama_local',
      model: DEFAULT_MODEL,
      data: {
        type: parsed.type === 'income' ? 'income' : 'expense',
        amount,
        date: cleanDate,
        description: parsed.description || 'Lançamento via IA',
        paymentMethod: parsed.paymentMethod === 'card' ? 'card' : 'account',
        categoryId: matchedCategory?.id || '',
        categoryName: matchedCategory?.name || parsed.suggestedCategory || '',
        subcategoryId: matchedSubcategory?.id || '',
        subcategoryName: matchedSubcategory?.name || parsed.suggestedSubcategory || '',
        accountId: matchedAccountId,
        cardId: matchedCardId,
        installments: Number(parsed.installments) || 1,
      },
    };
  } catch (err) {
    console.warn('⚠️ Falha na IA Local (Ollama):', err.message);
    // Safe heuristic fallback so user experience never fails
    return fallbackHeuristicParser(text, categories);
  }
}

/**
 * Fallback parser using regex and keywords when Ollama is busy or offline
 */
function fallbackHeuristicParser(text, categories = []) {
  const norm = text.toLowerCase();
  
  // Find money
  const moneyMatch = text.match(/(?:R\$|BRL)?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2})/i) || text.match(/(\d+)/);
  let amount = 0;
  if (moneyMatch) {
    amount = parseMoneyValue(moneyMatch[1]);
  }

  // Find type
  const isIncome = /\b(recebi|recebimento|pix recebido|salario|deposito|ted recebida)\b/i.test(norm);
  const type = isIncome ? 'income' : 'expense';

  // Find date
  let date = new Date().toISOString().split('T')[0];
  const dateMatch = text.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (dateMatch) {
    date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  return {
    success: true,
    provider: 'heuristic_fallback',
    data: {
      type,
      amount,
      date,
      description: text.slice(0, 40).trim() || 'Comprovante Importado',
      paymentMethod: norm.includes('cartao') || norm.includes('credito') ? 'card' : 'account',
      categoryId: categories[0]?.id || '',
      categoryName: categories[0]?.name || '',
      installments: 1,
    },
  };
}
