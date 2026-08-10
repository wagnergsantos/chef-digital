-- Remove the `source` column from the receitas table.
-- This migration is safe to rerun (IF EXISTS guards).

BEGIN;

ALTER TABLE receitas DROP COLUMN IF EXISTS source;

-- Recreate salvar_receita without p_source parameter
CREATE OR REPLACE FUNCTION salvar_receita(
  p_id BIGINT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_emoji TEXT DEFAULT '🍲',
  p_image TEXT DEFAULT NULL,
  p_tips TEXT DEFAULT NULL,
  p_servings INT DEFAULT NULL,
  p_category_id BIGINT DEFAULT NULL,
  p_category_key TEXT DEFAULT NULL,
  p_ingredientes JSONB DEFAULT '[]'::jsonb,
  p_passos JSONB DEFAULT '[]'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
  v_category_id BIGINT := p_category_id;
BEGIN
  IF v_category_id IS NULL AND p_category_key IS NOT NULL THEN
    SELECT id INTO v_category_id
    FROM categorias
    WHERE key = p_category_key
    LIMIT 1;
  END IF;

  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id
    FROM categorias
    WHERE key = 'lanches'
    LIMIT 1;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO receitas (title, emoji, image, tips, servings, category_id)
    VALUES (p_title, p_emoji, p_image, p_tips, p_servings, v_category_id)
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO receitas (id, title, emoji, image, tips, servings, category_id)
    VALUES (p_id, p_title, p_emoji, p_image, p_tips, p_servings, v_category_id)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      emoji = EXCLUDED.emoji,
      image = EXCLUDED.image,
      tips = EXCLUDED.tips,
      servings = EXCLUDED.servings,
      category_id = EXCLUDED.category_id,
      updated_at = NOW()
    RETURNING id INTO v_id;
  END IF;

  DELETE FROM ingredientes WHERE receita_id = v_id;
  IF p_ingredientes IS NOT NULL THEN
    INSERT INTO ingredientes (receita_id, name, qty, unit, ordem)
    SELECT
      v_id,
      item->>'name',
      CASE
        WHEN NULLIF(item->>'qty', '') IS NULL THEN NULL
        ELSE (item->>'qty')::numeric
      END,
      NULLIF(item->>'unit', ''),
      COALESCE((item->>'ordem')::int, 0)
    FROM jsonb_array_elements(p_ingredientes) AS item;
  END IF;

  DELETE FROM passos WHERE receita_id = v_id;
  IF p_passos IS NOT NULL THEN
    INSERT INTO passos (receita_id, step_text, ordem)
    SELECT v_id, item->>'step_text', COALESCE((item->>'ordem')::int, 0)
    FROM jsonb_array_elements(p_passos) AS item;
  END IF;

  RETURN v_id;
END;
$$;

COMMIT;
