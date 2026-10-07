-- =========================================================================
-- Migration: Add member_id column to transactions & family members sync
-- Data: 2026-10-07
-- Permite vincular lançamentos a membros específicos da família/cônjuge
-- =========================================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS member_id TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_member_id
  ON public.transactions(member_id);
