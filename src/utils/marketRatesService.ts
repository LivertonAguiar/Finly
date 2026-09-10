/**
 * Finly Market Rates & BACEN Official Indices Service
 * Integração oficial com as séries temporais do Banco Central do Brasil (SGS):
 * - Série 226: Taxa Referencial (TR diária / % a.m.)
 * - Série 433: IPCA mensal (% a.m.)
 */

export interface MarketRateResult {
  date: string;
  rate: number;
  source: 'bacen_api' | 'finly_server' | 'cache' | 'fallback';
  lastUpdated: string;
}

const TR_STORAGE_KEY = 'finly_cached_tr_rate_v1';
const IPCA_STORAGE_KEY = 'finly_cached_ipca_rate_v1';

// Fallbacks de segurança caso o BACEN esteja offline ou sem rede
const DEFAULT_TR_RATE = 0.1708; // % a.m. recente
const DEFAULT_IPCA_RATE = 0.38; // % a.m. recente

/**
 * Consulta a Taxa Referencial (TR) diária mais recente oficial do BACEN
 */
export async function getOfficialDailyTR(): Promise<MarketRateResult> {
  const cached = getStoredRate(TR_STORAGE_KEY);
  // Se temos cache de menos de 6 horas, retorna o cache para performance instantânea
  if (cached && (Date.now() - new Date(cached.lastUpdated).getTime()) < 6 * 60 * 60 * 1000) {
    return cached;
  }

  // 1. Tentar obter pelo backend Finly
  try {
    const res = await fetch('/api/market-indicators/latest', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.tr === 'number') {
        const result: MarketRateResult = {
          date: data.trDate || new Date().toISOString().split('T')[0],
          rate: data.tr,
          source: 'finly_server',
          lastUpdated: new Date().toISOString(),
        };
        saveStoredRate(TR_STORAGE_KEY, result);
        return result;
      }
    }
  } catch (e) {
    // Backend indisponível, prosseguir para fallback direto no BACEN
  }

  // 2. Consulta direta à API aberta do Banco Central do Brasil (Série 226 - TR)
  try {
    const res = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/1?formato=json',
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].valor) {
        const rateVal = parseFloat(data[0].valor.replace(',', '.'));
        const result: MarketRateResult = {
          date: data[0].data || new Date().toISOString().split('T')[0],
          rate: isNaN(rateVal) ? DEFAULT_TR_RATE : rateVal,
          source: 'bacen_api',
          lastUpdated: new Date().toISOString(),
        };
        saveStoredRate(TR_STORAGE_KEY, result);
        return result;
      }
    }
  } catch (e) {
    console.warn('⚠️ Não foi possível consultar a API do BACEN diretamente para TR:', e);
  }

  // 3. Fallback no cache existente ou valor padrão seguro
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  return {
    date: new Date().toLocaleDateString('pt-BR'),
    rate: DEFAULT_TR_RATE,
    source: 'fallback',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Consulta o IPCA mensal mais recente oficial do BACEN (Série 433)
 */
export async function getOfficialMonthlyIPCA(): Promise<MarketRateResult> {
  const cached = getStoredRate(IPCA_STORAGE_KEY);
  if (cached && (Date.now() - new Date(cached.lastUpdated).getTime()) < 12 * 60 * 60 * 1000) {
    return cached;
  }

  // 1. Tentar obter pelo backend Finly
  try {
    const res = await fetch('/api/market-indicators/latest', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.ipca === 'number') {
        const result: MarketRateResult = {
          date: data.ipcaDate || new Date().toISOString().split('T')[0],
          rate: data.ipca,
          source: 'finly_server',
          lastUpdated: new Date().toISOString(),
        };
        saveStoredRate(IPCA_STORAGE_KEY, result);
        return result;
      }
    }
  } catch (e) {}

  // 2. Consulta direta à API do Banco Central (Série 433 - IPCA)
  try {
    const res = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json',
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].valor) {
        const rateVal = parseFloat(data[0].valor.replace(',', '.'));
        const result: MarketRateResult = {
          date: data[0].data || new Date().toISOString().split('T')[0],
          rate: isNaN(rateVal) ? DEFAULT_IPCA_RATE : rateVal,
          source: 'bacen_api',
          lastUpdated: new Date().toISOString(),
        };
        saveStoredRate(IPCA_STORAGE_KEY, result);
        return result;
      }
    }
  } catch (e) {
    console.warn('⚠️ Não foi possível consultar a API do BACEN diretamente para IPCA:', e);
  }

  if (cached) {
    return { ...cached, source: 'cache' };
  }

  return {
    date: new Date().toLocaleDateString('pt-BR'),
    rate: DEFAULT_IPCA_RATE,
    source: 'fallback',
    lastUpdated: new Date().toISOString(),
  };
}

function getStoredRate(key: string): MarketRateResult | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveStoredRate(key: string, data: MarketRateResult): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}
