-- =========================================================================
-- Migration: Transaction Components (Splits Analíticos)
-- Data: 2026-09-14
-- Permite dividir uma transação financeira em múltiplos componentes analíticos
-- sem duplicar o impacto no saldo da conta bancária.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.transaction_components (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  category_id TEXT NOT NULL,
  subcategory_id TEXT,
  type TEXT NOT NULL DEFAULT 'one_time' CHECK (type IN ('fixed', 'variable', 'temporary', 'one_time')),
  recurrence_config JSONB,
  notes TEXT,
  is_remainder BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_transaction_components_updated_at ON public.transaction_components;
CREATE TRIGGER set_transaction_components_updated_at
BEFORE UPDATE ON public.transaction_components
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Campo indicador na transação pai para leitura performática
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS has_components BOOLEAN NOT NULL DEFAULT false;

-- Índices de consulta e integridade
CREATE INDEX IF NOT EXISTS idx_transaction_components_user_id
  ON public.transaction_components(user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_components_transaction_id
  ON public.transaction_components(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_components_category
  ON public.transaction_components(category_id, subcategory_id);

-- Segurança e Row Level Security (RLS)
ALTER TABLE public.transaction_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own transaction components" ON public.transaction_components;
CREATE POLICY "Users can manage own transaction components"
  ON public.transaction_components FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_components TO authenticated;
