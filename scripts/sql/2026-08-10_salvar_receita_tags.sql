-- Migration: Atualizar a Postgres Function salvar_receita para usar a tabela relacional receita_tags
-- Data: 2026-08-10

-- 1. Dropar todas as assinaturas antigas da função salvar_receita para evitar ambiguidades no Postgres
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'salvar_receita'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- 2. Criar a função salvar_receita integrada com as tabelas `tags` e `receita_tags`
CREATE OR REPLACE FUNCTION public.salvar_receita(
    p_id INT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_emoji TEXT DEFAULT '🍲',
    p_image TEXT DEFAULT NULL,
    p_tips TEXT DEFAULT NULL,
    p_servings INT DEFAULT NULL,
    p_prep_time INT DEFAULT NULL,
    p_cook_time INT DEFAULT NULL,
    p_source_url TEXT DEFAULT NULL,
    p_author TEXT DEFAULT NULL,
    p_category_id INT DEFAULT NULL,
    p_category_key TEXT DEFAULT NULL,
    p_tags JSONB DEFAULT '[]'::jsonb,
    p_ingredientes JSONB DEFAULT '[]'::jsonb,
    p_passos JSONB DEFAULT '[]'::jsonb
)
RETURNS INT AS $$
DECLARE
    v_recipe_id INT;
    v_item JSONB;
    v_tag_name TEXT;
    v_tag_key TEXT;
    v_tag_id INT;
BEGIN
    -- 1. Inserir ou Atualizar a Receita na tabela `receitas`
    IF p_id IS NOT NULL THEN
        UPDATE receitas
        SET title = p_title,
            emoji = COALESCE(p_emoji, '🍲'),
            image = p_image,
            tips = p_tips,
            servings = p_servings,
            prep_time = p_prep_time,
            cook_time = p_cook_time,
            source_url = p_source_url,
            author = p_author,
            category_id = p_category_id,
            updated_at = NOW()
        WHERE id = p_id;
        v_recipe_id := p_id;
    ELSE
        INSERT INTO receitas (
            title, emoji, image, tips, servings, prep_time, cook_time, source_url, author, category_id
        ) VALUES (
            p_title, COALESCE(p_emoji, '🍲'), p_image, p_tips, p_servings, p_prep_time, p_cook_time, p_source_url, p_author, p_category_id
        ) RETURNING id INTO v_recipe_id;
    END IF;

    -- 2. Inserção dos Ingredientes
    DELETE FROM ingredientes WHERE receita_id = v_recipe_id;
    IF p_ingredientes IS NOT NULL AND jsonb_array_length(p_ingredientes) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_ingredientes)
        LOOP
            INSERT INTO ingredientes (receita_id, name, qty, unit, ordem)
            VALUES (
                v_recipe_id,
                v_item->>'name',
                (v_item->>'qty')::NUMERIC,
                v_item->>'unit',
                COALESCE((v_item->>'ordem')::INT, 0)
            );
        END LOOP;
    END IF;

    -- 3. Inserção dos Passos
    DELETE FROM passos WHERE receita_id = v_recipe_id;
    IF p_passos IS NOT NULL AND jsonb_array_length(p_passos) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_passos)
        LOOP
            INSERT INTO passos (receita_id, step_text, ordem)
            VALUES (
                v_recipe_id,
                v_item->>'step_text',
                COALESCE((v_item->>'ordem')::INT, 0)
            );
        END LOOP;
    END IF;

    -- 4. Inserção/Vínculo das Tags na tabela relacional `receita_tags`
    DELETE FROM receita_tags WHERE receita_id = v_recipe_id;
    IF p_tags IS NOT NULL AND jsonb_array_length(p_tags) > 0 THEN
        FOR v_tag_name IN SELECT jsonb_array_elements_text(p_tags)
        LOOP
            v_tag_name := TRIM(v_tag_name);
            IF v_tag_name <> '' THEN
                -- Chave amigável para a tag
                v_tag_key := LOWER(REGEXP_REPLACE(v_tag_name, '[^a-zA-Z0-9]', '', 'g'));
                IF v_tag_key = '' THEN v_tag_key := LOWER(v_tag_name); END IF;

                -- Obter ou criar tag na tabela `tags`
                SELECT id INTO v_tag_id FROM tags WHERE key = v_tag_key OR LOWER(label) = LOWER(v_tag_name) LIMIT 1;
                IF v_tag_id IS NULL THEN
                    INSERT INTO tags (key, label)
                    VALUES (v_tag_key, v_tag_name)
                    ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label
                    RETURNING id INTO v_tag_id;
                END IF;

                -- Vincular na tabela `receita_tags`
                INSERT INTO receita_tags (receita_id, tag_id)
                VALUES (v_recipe_id, v_tag_id)
                ON CONFLICT (receita_id, tag_id) DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN v_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
