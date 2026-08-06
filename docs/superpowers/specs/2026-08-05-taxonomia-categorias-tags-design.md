# Taxonomia de Categorias e Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar o modelo de classificação de receitas para separar categorias estruturais de tags de contexto, com migração automática do legado.

**Architecture:** Categorias passam a representar tipo/papel da receita no cardápio (ex.: Frango, Carnes, Peixes, Massas, Sopas, Molhos, Lanches, Bolos & Doces, Acompanhamento, Temperos & Condimentos). Tags passam a cobrir contexto de uso (Almoço, Jantar, Marmitas, Refogados, Lancheira). O banco precisa ser migrado para converter categorias legadas como `arroz`, `batatas`, `legumes` e `feijao` para `acompanhamento`, `bife` para `carnes`, `macarrao` para `massas` e `lancheira` para tag.

**Tech Stack:** Supabase SQL, Vite, JavaScript ESM, Vitest.

---

### Task 1: Definir a nova taxonomia no banco

**Files:**
- Create: `scripts/migrate_taxonomy.sql`
- Modify: `scripts/create_tags_schema.sql`

- [ ] **Step 1: Write the migration SQL that renames and maps the legacy categories**

```sql
-- Migration: normalize recipe taxonomy

DO $$
BEGIN
  UPDATE receitas
  SET category = CASE
    WHEN category = 'bife' THEN 'carnes'
    WHEN category = 'macarrao' THEN 'massas'
    WHEN category IN ('arroz', 'batatas', 'legumes', 'feijao') THEN 'acompanhamento'
    ELSE category
  END
  WHERE category IS NOT NULL;
END $$;

UPDATE categorias
SET key = 'carnes', label = 'Carnes'
WHERE key = 'bife';

UPDATE categorias
SET key = 'massas', label = 'Massas'
WHERE key = 'macarrao';

UPDATE categorias
SET key = 'acompanhamento', label = 'Acompanhamento'
WHERE key IN ('arroz', 'batatas', 'legumes', 'feijao');

UPDATE categorias
SET key = 'temperos', label = 'Temperos & Condimentos'
WHERE key = 'temperos';

DELETE FROM categorias
WHERE key = 'lancheira';
```

- [ ] **Step 2: Run the migration on Supabase and verify the resulting keys**

Run:
```sql
SELECT key, label, sort_order
FROM categorias
ORDER BY sort_order;
```
Expected: keys are limited to `todos` plus the final taxonomy, and `lancheira` no longer appears in `categorias`.

- [ ] **Step 3: Add the final category/tag mapping comments to the SQL migration**

```sql
-- Final categories:
-- todos, frango, carnes, peixes, massas, sopas, molhos, lanches, bolos, acompanhamento, temperos
-- Final tags:
-- almoco, janta, marmitas, refogados, lancheira
```

- [ ] **Step 4: Commit the migration script**

```bash
git add scripts/migrate_taxonomy.sql scripts/create_tags_schema.sql
git commit -m "feat: normalize recipe taxonomy"
```

### Task 2: Update the admin payload and category labels

**Files:**
- Modify: `src/logic/admin-parser.js:1-80`
- Modify: `admin.html:1-120`

- [ ] **Step 1: Update the category label shown in the admin form**

```html
<label class="form-label">Categoria principal</label>
```

- [ ] **Step 2: Keep the payload single-category and ensure it matches the normalized keys**

```js
export function buildRecipePayload({
    id = null,
    title,
    emoji,
    image,
    source,
    tips,
    servings,
    selectedCategory,
    validIngredients,
    validSteps
}) {
    const numServings = servings ? parseInt(String(servings).trim(), 10) : null;
    const parsedServings = (!isNaN(numServings) && numServings > 0) ? numServings : null;

    return {
        p_id: id,
        p_title: (title || '').trim(),
        p_emoji: (emoji || '').trim() || '🍲',
        p_image: (image || '').trim() || null,
        p_source: (source || '').trim() || null,
        p_tips: (tips || '').trim() || null,
        p_servings: parsedServings,
        p_category: (selectedCategory || '').trim(),
        p_ingredientes: validIngredients,
        p_passos: validSteps
    };
}
```

- [ ] **Step 3: Run the existing parser tests**

Run:
```bash
npm run test -- src/logic/admin-parser.test.js
```
Expected: PASS.

- [ ] **Step 4: Commit the admin label and payload update**

```bash
git add admin.html src/logic/admin-parser.js
git commit -m "feat: align admin category naming"
```

### Task 3: Update recipe rendering and category filters

**Files:**
- Modify: `src/modules/recipes-render.js`
- Modify: `src/modules/state.js`
- Modify: `src/main.js`

- [ ] **Step 1: Map the new category keys in the recipe card filters**

```js
const CATEGORY_KEYS = [
    'frango',
    'carnes',
    'peixes',
    'massas',
    'sopas',
    'molhos',
    'lanches',
    'bolos',
    'acompanhamento',
    'temperos'
];
```

- [ ] **Step 2: Keep tags as the context filters and include `lancheira` there**

```js
const TAG_KEYS = [
    'almoco',
    'janta',
    'marmitas',
    'refogados',
    'lancheira'
];
```

- [ ] **Step 3: Preserve legacy category normalization for cached recipes**

```js
const legacyTagCategoryKeys = new Set(['almoco', 'janta', 'refogados', 'marmitas', 'lancheira']);
```

- [ ] **Step 4: Run the app build to catch invalid category references**

Run:
```bash
npm run build
```
Expected: build succeeds and category buttons render with the new keys.

- [ ] **Step 5: Commit the rendering and state cleanup**

```bash
git add src/main.js src/modules/recipes-render.js src/modules/state.js
git commit -m "feat: normalize recipe categories"
```

### Task 4: Validate the migration end to end

**Files:**
- Test: `scripts/migrate_taxonomy.sql`
- Test: `src/logic/admin-parser.test.js`

- [ ] **Step 1: Run the taxonomy migration in Supabase SQL editor**

Use `scripts/migrate_taxonomy.sql` and verify:
```sql
SELECT category, COUNT(*) FROM receitas GROUP BY category ORDER BY category;
SELECT key, label FROM categorias ORDER BY sort_order;
```

- [ ] **Step 2: Confirm that legacy values are gone**

```sql
SELECT COUNT(*) AS remaining
FROM receitas
WHERE category IN ('bife', 'macarrao', 'arroz', 'batatas', 'legumes', 'feijao', 'lancheira');
```
Expected: `remaining = 0`.

- [ ] **Step 3: Confirm the tags table still contains the context tags**

```sql
SELECT key, label
FROM tags
ORDER BY sort_order;
```
Expected: `almoco`, `janta`, `refogados`, `marmitas`, `lancheira`.

- [ ] **Step 4: Commit any verification notes if needed**

```bash
git add scripts/migrate_taxonomy.sql
git commit -m "chore: document taxonomy migration checks"
```
