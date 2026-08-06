-- ============================================================================
-- Migration: Switch receitas.category to single category key (TEXT)
-- Deprecated: use scripts/migrate_category_ids.sql instead.
-- Keeps tags in receita_tags and removes category arrays.
-- ============================================================================

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
    ALTER TABLE receitas ADD COLUMN IF NOT EXISTS category_single TEXT;

    UPDATE receitas
    SET category_single = COALESCE(
      (
        SELECT c
        FROM unnest(category) AS c
        WHERE c NOT IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira')
        LIMIT 1
      ),
      category[1],
      'lanches'
    );

    ALTER TABLE receitas DROP COLUMN category;
    ALTER TABLE receitas RENAME COLUMN category_single TO category;
  ELSE
    UPDATE receitas
    SET category = COALESCE(NULLIF(category, ''), 'lanches');
  END IF;
END $$;

-- Optional hardening:
-- ALTER TABLE receitas ALTER COLUMN category SET NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_receitas_category ON receitas(category);
