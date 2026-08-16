-- Migration: Criar função excluir_receita
-- Data: 2026-08-10
-- Descrição: RPC atômica para exclusão completa de uma receita e todos
--            os seus registros dependentes (tags, ingredientes, passos).
--            Garante consistência mesmo sem CASCADE configurado nas FK.

CREATE OR REPLACE FUNCTION public.excluir_receita(p_id INT)
RETURNS VOID AS $$
BEGIN
    -- Validação básica
    IF p_id IS NULL THEN
        RAISE EXCEPTION 'p_id não pode ser nulo.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM receitas WHERE id = p_id) THEN
        RAISE EXCEPTION 'Receita com id % não encontrada.', p_id;
    END IF;

    -- 1. Remover vínculos de tags
    DELETE FROM receita_tags WHERE receita_id = p_id;

    -- 2. Remover ingredientes
    DELETE FROM ingredientes WHERE receita_id = p_id;

    -- 3. Remover passos
    DELETE FROM passos WHERE receita_id = p_id;

    -- 4. Remover a receita
    DELETE FROM receitas WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissão: apenas usuários autenticados podem chamar
REVOKE ALL ON FUNCTION public.excluir_receita(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.excluir_receita(INT) TO authenticated;
