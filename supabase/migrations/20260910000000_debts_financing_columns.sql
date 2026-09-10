-- ==============================================================================
-- FINLY - DEBTS FINANCING COLUMNS MIGRATION
-- Migration: 20260910000000_debts_financing_columns.sql
-- Description: Adds structured financing columns to the debts table and
--              debt linkage columns to transactions for proper amortization
--              schedule tracking (Price / SAC / TR / Insurance / Admin fees).
-- ==============================================================================

-- 1. Add structured financing columns to debts
ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'loan'
    CHECK (contract_type IN ('loan', 'real_estate', 'vehicle')),
  ADD COLUMN IF NOT EXISTS amortization_system TEXT DEFAULT 'PRICE'
    CHECK (amortization_system IN ('PRICE', 'SAC')),
  ADD COLUMN IF NOT EXISTS indexer TEXT DEFAULT 'TR'
    CHECK (indexer IN ('TR', 'IPCA', 'FIXED')),
  ADD COLUMN IF NOT EXISTS indexer_rate NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS insurance_monthly NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS admin_fee_monthly NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS contract_number TEXT,
  ADD COLUMN IF NOT EXISTS default_account_id TEXT,
  ADD COLUMN IF NOT EXISTS sync_to_transactions BOOLEAN NOT NULL DEFAULT true;

-- 2. Add debt linkage columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS debt_id TEXT,
  ADD COLUMN IF NOT EXISTS debt_installment_number INTEGER;

-- 3. Index for efficient debt-linked transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_debt
  ON public.transactions(debt_id)
  WHERE debt_id IS NOT NULL;

-- 4. Backfill: extract debt_id from existing JSONB installments field
-- This populates the new columns for transactions that already have
-- debt linkage stored in the installments JSON blob.
UPDATE public.transactions
SET
  debt_id = installments->>'debtId',
  debt_installment_number = (installments->>'debtInstallmentNumber')::INTEGER
WHERE
  debt_id IS NULL
  AND installments IS NOT NULL
  AND installments->>'debtId' IS NOT NULL;
