-- =========================================================================
-- Migration: Multidimensional Taxonomy & Characteristics
-- Data: 2026-09-14
-- Adiciona suporte a Natureza Financeira, Características Estruturadas
-- e Relacionamentos de Contexto às transações e componentes.
-- =========================================================================

-- 1. Transações principais
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS financial_nature TEXT,
  ADD COLUMN IF NOT EXISTS characteristics JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS relationships JSONB DEFAULT '{}'::jsonb;

-- 2. Componentes de transações
ALTER TABLE public.transaction_components
  ADD COLUMN IF NOT EXISTS financial_nature TEXT,
  ADD COLUMN IF NOT EXISTS characteristics JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS relationships JSONB DEFAULT '{}'::jsonb;

-- 3. Índices de busca e filtros para características e relacionamentos
CREATE INDEX IF NOT EXISTS idx_transactions_financial_nature
  ON public.transactions(financial_nature);

CREATE INDEX IF NOT EXISTS idx_transactions_characteristics_gin
  ON public.transactions USING GIN (characteristics);

CREATE INDEX IF NOT EXISTS idx_transactions_relationships_gin
  ON public.transactions USING GIN (relationships);

CREATE INDEX IF NOT EXISTS idx_tx_components_financial_nature
  ON public.transaction_components(financial_nature);

CREATE INDEX IF NOT EXISTS idx_tx_components_characteristics_gin
  ON public.transaction_components USING GIN (characteristics);

CREATE INDEX IF NOT EXISTS idx_tx_components_relationships_gin
  ON public.transaction_components USING GIN (relationships);
