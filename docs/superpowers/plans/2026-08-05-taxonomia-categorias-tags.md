# Taxonomia de Categorias e Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar categorias e tags para que receitas tenham uma categoria principal coerente e tags de contexto, com migração automática do legado.

**Architecture:** Categorias passam a representar o papel/tipo da receita no cardápio, enquanto tags cobrem contexto de uso. O legado atual precisa ser normalizado no banco, com `bife` virando `carnes`, `macarrao` virando `massas`, e `arroz`, `batatas`, `legumes` e `feijao` consolidando em `acompanhamento`; `lancheira` sai de categorias e continua como tag.

**Tech Stack:** Supabase SQL, JavaScript ESM, Vite, Vitest.

---

### Task 1: Criar o script de migração da taxonomia

**Files:**
- Create: `scripts/migrate_taxonomy.sql`
- Modify: `scripts/create_tags_schema.sql`

- [ ] **Step 1: Write the SQL migration that remaps legacy categories**

```sql
-- Normalize recipe taxonomy to the final category set.
-- Run once in the Supabase SQL editor.

BEGIN;

UPDATE receitas
SET category = CASE
  WHEN category = 'bife' THEN 'carnes'
  WHEN category = 'macarrao' THEN 'massas'
  WHEN category IN ('arroz', 'batatas', 'legumes', 'feijao') THEN 'acompanhamento'
  WHEN category = 'lancheira' THEN 'acompanhamento'
  ELSE category
END
WHERE category IS NOT NULL;

UPDATE categorias
SET key = 'carnes', label = 'Carnes'
WHERE key = 'bife';

UPDATE categorias
SET key = 'massas', label = 'Massas'
WHERE key = 'macarrao';

UPDATE categorias
SET key = 'acompanhamento', label = 'Acompanhamento'
WHERE key IN ('arroz', 'batatas', 'legumes', 'feijao', 'lancheira');

UPDATE categorias
SET key = 'temperos', label = 'Temperos & Condimentos'
WHERE key = 'temperos';

COMMIT;
```

- [ ] **Step 2: Add the final allowed taxonomy in comments**

```sql
-- Final categories:
-- todos, frango, carnes, peixes, massas, sopas, molhos, lanches, bolos, acompanhamento, temperos
--
-- Final tags:
-- almoco, janta, marmitas, refogados, lancheira
```

- [ ] **Step 3: Save the migration script**

Run no shell:
```bash
git status --short
```
Expected: `scripts/migrate_taxonomy.sql` appears as a new file after it is created.

- [ ] **Step 4: Commit the migration script**

```bash
git add scripts/migrate_taxonomy.sql scripts/create_tags_schema.sql
git commit -m "feat: normalize recipe taxonomy"
```

### Task 2: Align the admin form with the final category model

**Files:**
- Modify: `admin.html:1-120`
- Modify: `src/logic/admin-parser.js:1-80`

- [ ] **Step 1: Keep the admin label on a single category**

```html
<label class="form-label">Categoria principal</label>
```

- [ ] **Step 2: Keep the payload as one normalized category key**

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

- [ ] **Step 3: Run the parser tests**

Run:
```bash
npm run test -- src/logic/admin-parser.test.js
```
Expected: PASS.

- [ ] **Step 4: Commit the admin changes**

```bash
git add admin.html src/logic/admin-parser.js
git commit -m "feat: align admin category naming"
```

### Task 3: Update recipe filters for the final category and tag sets

**Files:**
- Modify: `src/main.js:200-280`
- Modify: `src/modules/recipes-render.js`
- Modify: `src/modules/state.js`

- [ ] **Step 1: Normalize legacy categories while loading cached recipes**

```js
const legacyTagCategoryKeys = new Set(['almoco', 'janta', 'refogados', 'marmitas']);

if (Array.isArray(recipe.category)) {
    const normalized = recipe.category.find(c => !legacyTagCategoryKeys.has(c)) || recipe.category[0] || null;
    recipe.category = normalized;
}
```

- [ ] **Step 2: Render category filters with the final category keys**

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

- [ ] **Step 3: Render tags with `lancheira` as a tag**

```js
const TAG_KEYS = [
    'almoco',
    'janta',
    'marmitas',
    'refogados',
    'lancheira'
];
```

- [ ] **Step 4: Run the build to catch broken category references**

Run:
```bash
npm run build
```
Expected: build succeeds and no filter references point to removed category keys.

- [ ] **Step 5: Commit the filter update**

```bash
git add src/main.js src/modules/recipes-render.js src/modules/state.js
git commit -m "feat: normalize recipe categories"
```

### Task 4: Validate the Supabase data after migration

**Files:**
- Test: `scripts/migrate_taxonomy.sql`

- [ ] **Step 1: Run the migration in the Supabase SQL editor**

Use `scripts/migrate_taxonomy.sql` and then run:
```sql
SELECT category, COUNT(*)
FROM receitas
GROUP BY category
ORDER BY category;
```

- [ ] **Step 2: Verify the old category keys are gone**

```sql
SELECT COUNT(*) AS remaining
FROM receitas
WHERE category IN ('bife', 'macarrao', 'arroz', 'batatas', 'legumes', 'feijao', 'lancheira');
```
Expected: `remaining = 0`.

- [ ] **Step 3: Verify the context tags still exist**

```sql
SELECT key, label
FROM tags
ORDER BY sort_order;
```
Expected: `almoco`, `janta`, `marmitas`, `refogados`, `lancheira`.

- [ ] **Step 4: Commit the verification notes if the script changes**

```bash
git add scripts/migrate_taxonomy.sql
git commit -m "chore: document taxonomy migration checks"
```
