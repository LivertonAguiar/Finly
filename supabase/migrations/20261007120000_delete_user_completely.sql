-- ==============================================================================
-- FINLY - EXPURGO E EXCLUSÃO DEFINITIVA DE CONTA DE USUÁRIO
-- Migration: 20261007120000_delete_user_completely.sql
-- Description: Função para exclusão completa e atômica de todos os dados
-- financeiros e cadastrais vinculados ao usuário, incluindo profiles.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  calling_user_id UUID;
BEGIN
  -- Obter o ID do usuário que fez a chamada pela sessão autenticada
  calling_user_id := auth.uid();

  -- Validação de segurança: apenas o próprio usuário ou a service_role podem executar
  IF calling_user_id IS NOT NULL AND calling_user_id <> target_user_id THEN
    RAISE EXCEPTION 'Acesso negado: você só pode excluir a sua própria conta.';
  END IF;

  -- 1. Exclusão das tabelas filhas e componentes analíticos
  DELETE FROM public.transaction_components WHERE user_id = target_user_id;
  DELETE FROM public.transactions WHERE user_id = target_user_id;
  DELETE FROM public.transaction_series WHERE user_id = target_user_id;
  DELETE FROM public.credit_cards WHERE user_id = target_user_id;
  DELETE FROM public.budgets WHERE user_id = target_user_id;
  DELETE FROM public.goals WHERE user_id = target_user_id;
  DELETE FROM public.debts WHERE user_id = target_user_id;
  DELETE FROM public.investments WHERE user_id = target_user_id;
  DELETE FROM public.categories WHERE user_id = target_user_id;
  DELETE FROM public.family_members WHERE user_id = target_user_id;
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.accounts WHERE user_id = target_user_id;

  -- 2. Exclusão do perfil público
  DELETE FROM public.profiles WHERE id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões de execução para usuários autenticados e service_role
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO service_role;
