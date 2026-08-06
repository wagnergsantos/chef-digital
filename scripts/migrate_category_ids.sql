-- Normalize categories to use a numeric foreign key.
-- This script is safe to rerun.

BEGIN;

CREATE SEQUENCE IF NOT EXISTS categorias_id_seq;

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS id BIGINT;

UPDATE categorias
SET id = nextval('categorias_id_seq')
WHERE id IS NULL;

SELECT setval(
  'categorias_id_seq',
  COALESCE((SELECT MAX(id) FROM categorias), 1),
  true
);

ALTER TABLE categorias
  ALTER COLUMN id SET DEFAULT nextval('categorias_id_seq');

ALTER TABLE categorias
  ALTER COLUMN id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categorias_id_idx ON categorias(id);
ALTER SEQUENCE categorias_id_seq OWNED BY categorias.id;

ALTER TABLE receitas
  ADD COLUMN IF NOT EXISTS category_id BIGINT;

DO $$
DECLARE
  is_array_column boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'receitas'
      AND column_name = 'category'
      AND udt_name = '_text'
  ) INTO is_array_column;

  IF is_array_column THEN
    UPDATE receitas r
    SET category_id = c.id
    FROM categorias c
    WHERE r.category_id IS NULL
      AND c.key = COALESCE(
        (
          SELECT item
          FROM unnest(r.category) AS item
          WHERE item NOT IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira')
          LIMIT 1
        ),
        'lanches'
      );
  ELSE
    UPDATE receitas r
    SET category_id = c.id
    FROM categorias c
    WHERE r.category_id IS NULL
      AND c.key = CASE
        WHEN r.category IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira') THEN 'lanches'
        WHEN r.category IN ('bife', 'carne') THEN 'carnes'
        WHEN r.category IN ('peixe', 'peixes') THEN 'peixes'
        WHEN r.category IN ('macarrao', 'massa', 'massas') THEN 'massas'
        WHEN r.category IN ('arroz', 'batatas', 'legumes', 'feijao') THEN 'acompanhamento'
        ELSE COALESCE(NULLIF(r.category, ''), 'lanches')
      END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'receitas'
      AND constraint_name = 'receitas_category_id_fkey'
  ) THEN
    ALTER TABLE receitas
      ADD CONSTRAINT receitas_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categorias(id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION salvar_receita(
  p_id BIGINT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_emoji TEXT DEFAULT '🍲',
  p_image TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
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
    INSERT INTO receitas (title, emoji, image, source, tips, servings, category_id)
    VALUES (p_title, p_emoji, p_image, p_source, p_tips, p_servings, v_category_id)
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO receitas (id, title, emoji, image, source, tips, servings, category_id)
    VALUES (p_id, p_title, p_emoji, p_image, p_source, p_tips, p_servings, v_category_id)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      emoji = EXCLUDED.emoji,
      image = EXCLUDED.image,
      source = EXCLUDED.source,
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
