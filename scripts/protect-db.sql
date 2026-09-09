-- Finly Database Shield: Permanently prevent resurrection of stale August ghost data
DELETE FROM transactions 
WHERE user_id = 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b' 
  AND (
    id LIKE 'tx-1788095%' 
    OR id LIKE 'tx-1788210%' 
    OR id LIKE '%1788193846930%' 
    OR created_at < '2026-09-01'
    OR date < '2026-09-01'
  );

DELETE FROM credit_cards 
WHERE user_id = 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b' 
  AND id IN ('card-1788094641945-bzt', 'card-1788094677952-2ym', 'card-1788916198444-dq3');

-- 1. Trigger to block ghost transactions (targeted to the exact stale test IDs)
CREATE OR REPLACE FUNCTION prevent_ghost_transactions_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    NEW.id LIKE 'tx-1788095%' 
    OR NEW.id LIKE 'tx-1788210%' 
    OR NEW.id LIKE '%1788193846930%'
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ghost_transactions ON transactions;
CREATE TRIGGER trg_prevent_ghost_transactions
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION prevent_ghost_transactions_fn();

-- 2. Trigger to block ghost cards
CREATE OR REPLACE FUNCTION prevent_ghost_cards_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IN ('card-1788094641945-bzt', 'card-1788094677952-2ym', 'card-1788916198444-dq3') THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ghost_cards ON credit_cards;
CREATE TRIGGER trg_prevent_ghost_cards
BEFORE INSERT OR UPDATE ON credit_cards
FOR EACH ROW
EXECUTE FUNCTION prevent_ghost_cards_fn();
