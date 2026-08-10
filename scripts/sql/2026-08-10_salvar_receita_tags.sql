-- Migration: Atualizar a Postgres Function salvar_receita para incluir suporte a tags dinamicas (p_tags)
-- Data: 2026-08-10

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
    v_tags_array TEXT[];
BEGIN
    -- Converter JSONB de tags em ARRAY TEXT do Postgres
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_tags)) INTO v_tags_array;

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
            tags = v_tags_array,
            updated_at = NOW()
        WHERE id = p_id;
        v_recipe_id := p_id;
    ELSE
        INSERT INTO receitas (
            title, emoji, image, tips, servings, prep_time, cook_time, source_url, author, category_id, tags
        ) VALUES (
            p_title, COALESCE(p_emoji, '🍲'), p_image, p_tips, p_servings, p_prep_time, p_cook_time, p_source_url, p_author, p_category_id, v_tags_array
        ) RETURNING id INTO v_recipe_id;
    END IF;

    -- Inserção dos Ingredientes
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

    -- Inserção dos Passos
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

    RETURN v_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
