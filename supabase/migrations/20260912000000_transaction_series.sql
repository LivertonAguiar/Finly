-- Explicit series for card installments and recurring expenses.
CREATE TABLE IF NOT EXISTS public.transaction_series (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('card_installment', 'recurring_expense')),
  description TEXT NOT NULL,
  category_id TEXT NOT NULL,
  subcategory_id TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_transaction_series_updated_at ON public.transaction_series;
CREATE TRIGGER set_transaction_series_updated_at
BEFORE UPDATE ON public.transaction_series
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS series_id TEXT REFERENCES public.transaction_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_sequence INTEGER,
  ADD COLUMN IF NOT EXISTS occurrence_key TEXT,
  ADD COLUMN IF NOT EXISTS is_series_exception BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_exclusion_reason TEXT
    CHECK (analytics_exclusion_reason IN ('manual', 'third_party', 'reimbursement')),
  ADD COLUMN IF NOT EXISTS reimbursement_for_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS reimbursement_for_series_id TEXT;

CREATE INDEX IF NOT EXISTS idx_transaction_series_user_id
  ON public.transaction_series(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_series_occurrence
  ON public.transactions(user_id, series_id, occurrence_key)
  WHERE series_id IS NOT NULL AND occurrence_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_reimbursement_transaction
  ON public.transactions(user_id, reimbursement_for_transaction_id)
  WHERE reimbursement_for_transaction_id IS NOT NULL;

ALTER TABLE public.transaction_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own transaction series" ON public.transaction_series;
CREATE POLICY "Users can manage own transaction series"
  ON public.transaction_series FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_series TO authenticated;

-- Transitional, deterministic analytics backfill. The boolean remains for one
-- compatibility release while all readers accept both representations.
UPDATE public.transactions
SET analytics_exclusion_reason = CASE
  WHEN is_third_party THEN 'third_party'
  WHEN ignored THEN 'manual'
  ELSE analytics_exclusion_reason
END
WHERE analytics_exclusion_reason IS NULL AND (is_third_party OR ignored);
