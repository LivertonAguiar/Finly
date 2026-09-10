import type { Debt, DebtContractType } from '../types';

/**
 * Infers the contract type for debts.
 * Prioritizes explicitly stored contractType, and for legacy records
 * without a persisted type, applies keyword heuristics on title and creditor.
 */
export const inferContractType = (d: Partial<Debt>): DebtContractType => {
  // 1. Tipos explicitamente definidos como imóvel ou veículo
  if (d.contractType === 'real_estate' || d.contractType === 'vehicle') {
    return d.contractType;
  }

  // 2. Heurísticas por texto de título e credor
  const text = `${d.title || ''} ${d.creditor || ''}`.toLowerCase();
  if (/imob|habita|casa|apto|apartamento|sfi|sfh|caixa.*habit|financ.*imov/i.test(text)) {
    return 'real_estate';
  }
  if (/veíc|veiculo|carro|auto|moto|consórcio.*auto|financ.*veic/i.test(text)) {
    return 'vehicle';
  }

  // 3. Indicadores estruturados de financiamento (sistema SAC/PRICE, seguros MIP/DFI, TR ou prazo longo)
  const isLongTerm = (d.totalInstallments && d.totalInstallments > 60) || d.indexer === 'TR' || Boolean(d.insuranceMonthly);
  if (isLongTerm || d.amortizationSystem === 'SAC' || /financ/i.test(text)) {
    if (/carro|auto|moto|veic/i.test(text)) return 'vehicle';
    return 'real_estate';
  }

  // 4. Se for empréstimo puro sem características de financiamento
  return 'loan';
};
