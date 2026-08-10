-- Normalize recipe taxonomy to the final category/tag split.
-- Safe to rerun in Supabase.

BEGIN;

-- Keep lancheira as a tag, not a category.
INSERT INTO tags (key, label, sort_order)
VALUES ('lancheira', 'Lancheira', 4)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

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
    INSERT INTO receita_tags (receita_id, tag_id)
    SELECT DISTINCT r.id, t.id
    FROM receitas r
    JOIN tags t
      ON t.key IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira')
    WHERE EXISTS (
      SELECT 1
      FROM unnest(r.category) AS c
      WHERE c = t.key
    )
    ON CONFLICT (receita_id, tag_id) DO NOTHING;

    ALTER TABLE receitas ADD COLUMN IF NOT EXISTS category_single TEXT;

    UPDATE receitas
    SET category_single = COALESCE(
      (
        SELECT c
        FROM unnest(category) AS c
        WHERE c NOT IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira')
        LIMIT 1
      ),
      'lanches'
    );

    ALTER TABLE receitas DROP COLUMN category;
    ALTER TABLE receitas RENAME COLUMN category_single TO category;
  ELSE
    INSERT INTO receita_tags (receita_id, tag_id)
    SELECT DISTINCT r.id, t.id
    FROM receitas r
    JOIN tags t
      ON t.key IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira')
    WHERE r.category = t.key
    ON CONFLICT (receita_id, tag_id) DO NOTHING;

    UPDATE receitas
    SET category = CASE
      WHEN category IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira') THEN 'lanches'
      ELSE COALESCE(NULLIF(category, ''), 'lanches')
    END;
  END IF;
END $$;

UPDATE receitas
SET category = CASE
  WHEN category IN ('bife', 'carne') THEN 'carnes'
  WHEN category IN ('peixe', 'peixes') THEN 'peixes'
  WHEN category IN ('macarrao', 'massa', 'massas') THEN 'massas'
  WHEN category IN ('arroz', 'batatas', 'legumes', 'feijao') THEN 'acompanhamento'
  WHEN category = 'lancheira' THEN 'lanches'
  WHEN category IS NULL OR category = '' THEN 'lanches'
  ELSE category
END;

INSERT INTO categorias (key, label, sort_order) VALUES
  ('todos', 'Todos', 0),
  ('frango', 'Frango', 1),
  ('carnes', 'Carnes', 2),
  ('peixes', 'Peixes', 3),
  ('massas', 'Massas', 4),
  ('sopas', 'Sopas & Caldos', 5),
  ('molhos', 'Molhos', 6),
  ('lanches', 'Lanches', 7),
  ('bolos', 'Bolos & Doces', 8),
  ('acompanhamento', 'Acompanhamento', 9),
  ('temperos', 'Temperos & Condimentos', 10)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

DELETE FROM categorias
WHERE key NOT IN (
  'todos', 'frango', 'carnes', 'peixes', 'massas', 'sopas',
  'molhos', 'lanches', 'bolos', 'acompanhamento', 'temperos'
);

COMMIT;
