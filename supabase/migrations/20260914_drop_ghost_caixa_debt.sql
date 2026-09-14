-- 1. Trigger para bloquear permanentemente qualquer tentativa de reinserir o ID fantasma
CREATE OR REPLACE FUNCTION drop_ghost_debts_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id = 'debt-1789003413274-l3jh' THEN
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_drop_ghost_debts ON debts;
CREATE TRIGGER trg_drop_ghost_debts
BEFORE INSERT OR UPDATE ON debts
FOR EACH ROW
EXECUTE FUNCTION drop_ghost_debts_trigger();

-- 2. Trigger para transações vinculadas ao ID fantasma (por coluna debt_id, por id ou por installments->debtId)
CREATE OR REPLACE FUNCTION drop_ghost_debt_transactions_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.debt_id = 'debt-1789003413274-l3jh'
       OR NEW.id LIKE '%debt-1789003413274-l3jh%'
       OR (NEW.installments IS NOT NULL AND NEW.installments->>'debtId' = 'debt-1789003413274-l3jh') THEN
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_drop_ghost_debt_transactions ON transactions;
CREATE TRIGGER trg_drop_ghost_debt_transactions
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION drop_ghost_debt_transactions_trigger();

-- 3. Deletar as transações e o registro da dívida fantasma existentes
DELETE FROM transactions 
WHERE debt_id = 'debt-1789003413274-l3jh'
   OR id LIKE '%debt-1789003413274-l3jh%'
   OR (installments IS NOT NULL AND installments->>'debtId' = 'debt-1789003413274-l3jh');

DELETE FROM debts WHERE id = 'debt-1789003413274-l3jh';
