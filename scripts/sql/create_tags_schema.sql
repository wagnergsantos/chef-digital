-- ============================================================================
-- Migration: Add Tags Support to Chef Digital
-- This script creates the tags infrastructure and maps existing categories
-- to tags for Almoço, Jantar, Refogado, Marmitas, Lancheira
-- ============================================================================

-- 1. Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create junction table for recipes <-> tags
CREATE TABLE IF NOT EXISTS receita_tags (
  receita_id BIGINT NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (receita_id, tag_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insert tags that were previously in categories
-- These tags represent usage context, not dish type
INSERT INTO tags (key, label, sort_order) VALUES
  ('almoco', 'Almoço', 0),
  ('janta', 'Jantares', 1),
  ('refogados', 'Refogados', 2),
  ('marmitas', 'Marmitas', 3),
  ('lancheira', 'Lancheira', 4)
ON CONFLICT (key) DO NOTHING;

-- 4. Map existing category data to receita_tags
-- For each recipe, map its category array values to tags
INSERT INTO receita_tags (receita_id, tag_id)
SELECT DISTINCT 
  r.id,
  t.id
FROM receitas r
CROSS JOIN tags t
WHERE 
  -- Map almoco category to almoco tag
  (r.category::text LIKE '%"almoco"%' AND t.key = 'almoco')
  OR (r.category::text LIKE '%almoco%' AND t.key = 'almoco')
  
  -- Map janta category to janta tag
  OR (r.category::text LIKE '%"janta"%' AND t.key = 'janta')
  OR (r.category::text LIKE '%janta%' AND t.key = 'janta')
  
  -- Map refogados category to refogados tag
  OR (r.category::text LIKE '%"refogados"%' AND t.key = 'refogados')
  OR (r.category::text LIKE '%refogados%' AND t.key = 'refogados')
  
  -- Map marmitas category to marmitas tag
  OR (r.category::text LIKE '%"marmitas"%' AND t.key = 'marmitas')
  OR (r.category::text LIKE '%marmitas%' AND t.key = 'marmitas')
  
  -- Map lancheira category to lancheira tag
  OR (r.category::text LIKE '%"lancheira"%' AND t.key = 'lancheira')
  OR (r.category::text LIKE '%lancheira%' AND t.key = 'lancheira')
ON CONFLICT (receita_id, tag_id) DO NOTHING;

-- 5. Remove tag-based categories from categorias table
DELETE FROM categorias 
WHERE key IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira');

-- 6. Remove tag-based values from receitas.category when category is still text[]
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'receitas'
      AND column_name = 'category'
      AND udt_name = '_text'
  ) THEN
    UPDATE receitas
    SET category = array_remove(array_remove(array_remove(array_remove(array_remove(
      category, 'almoco'), 'janta'), 'refogados'), 'marmitas'), 'lancheira')
    WHERE category IS NOT NULL;
  END IF;
END $$;

-- 7. Enable RLS on new tables (if you use RLS)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE receita_tags ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for public access (adjust if needed)
DROP POLICY IF EXISTS "Tags are viewable by anyone" ON tags;
CREATE POLICY "Tags are viewable by anyone" 
  ON tags FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Receita tags are viewable by anyone" ON receita_tags;
CREATE POLICY "Receita tags are viewable by anyone" 
  ON receita_tags FOR SELECT 
  USING (true);

-- ============================================================================
-- Verification queries (run these to check the migration)
-- ============================================================================
-- SELECT * FROM tags;
-- SELECT COUNT(*) as total_tag_mappings FROM receita_tags;
-- SELECT r.id, r.title, r.category, array_agg(t.label) as tags 
--   FROM receitas r 
--   LEFT JOIN receita_tags rt ON r.id = rt.receita_id 
--   LEFT JOIN tags t ON rt.tag_id = t.id 
--   GROUP BY r.id, r.title, r.category
--   ORDER BY r.id;
-- SELECT * FROM categorias WHERE key IN ('almoco', 'janta', 'refogados', 'marmitas', 'lancheira');
