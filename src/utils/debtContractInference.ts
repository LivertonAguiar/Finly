import type { Debt, DebtContractType } from '../types';

/**
 * Infers the contract type for debts.
 * Prioritizes explicitly stored contractType, and for legacy records
 * without a persisted type, applies keyword heuristics on title and creditor.
 */
export const inferContractType = (d: Partial<Debt>): DebtContractType => {
  if (d.contractType && d.contractType !== 'loan') return d.contractType;
  if (d.contractType === 'loan') return 'loan';
  // No contractType stored — try to infer from text
  const text = `${d.title || ''} ${d.creditor || ''}`.toLowerCase();
  if (/imob|habita|casa|apto|apartamento|sfi|sfh|caixa.*habit|financ.*imov/i.test(text)) return 'real_estate';
  if (/veíc|veiculo|carro|auto|moto|consórcio.*auto|financ.*veic/i.test(text)) return 'vehicle';
  return 'loan';
};
