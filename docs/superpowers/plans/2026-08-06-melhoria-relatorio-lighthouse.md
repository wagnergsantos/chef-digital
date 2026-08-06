# Melhoria do Relatorio Lighthouse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar performance (LCP/FCP/SI) sem regressao funcional, corrigindo os pontos do `docs/relatorio_receitas.report.json`.

**Architecture:** Vamos reduzir o caminho critico da home em quatro frentes: isolamento de assets publico/admin, entrega de imagem mais eficiente na grade, bootstrap de dados em duas fases, e correcoes de SEO/A11y de baixo risco. A implementacao preserva a arquitetura atual (`api/`, `logic/`, `modules/`) e concentra logica testavel em funcoes puras.

**Tech Stack:** Vite, JavaScript ESM, Vitest, Oxlint, Supabase JS.

---

## File Structure and Responsibilities

- `docs/superpowers/specs/2026-08-06-melhoria-relatorio-lighthouse-design.md`: especificacao aprovada (fonte da implementacao).
- `src/logic/performance-guards.js` (create): funcoes puras para regras de carregamento de imagem e nome acessivel de cards.
- `src/logic/performance-guards.test.js` (create): testes unitarios dessas regras.
- `src/api/recipes-loader.js` (create): funcoes de carregamento de dados por fase (resumo inicial + detalhes sob demanda).
- `src/api/recipes-loader.test.js` (create): testes unitarios com mocks de retorno do Supabase.
- `src/modules/recipes-render.js` (modify): integrar helper de imagem responsiva e nome acessivel.
- `src/main.js` (modify): migrar bootstrap para duas fases usando `recipes-loader`.
- `index.html` (modify): adicionar `meta description`.
- `vite.config.js` (modify): ajustar estrategia de build para evitar cross-injection de CSS do admin na home.

### Task 1: Criar guardas testaveis para imagem e acessibilidade

**Files:**
- Create: `src/logic/performance-guards.js`
- Create: `src/logic/performance-guards.test.js`
- Test: `src/logic/performance-guards.test.js`

- [ ] **Step 1: Write the failing test for image loading and accessible naming rules**

```js
import { describe, it, expect } from 'vitest';
import {
  getCardImageLoadingAttrs,
  buildRecipeCardAccessibleName
} from './performance-guards.js';

describe('Logic: Performance Guards', () => {
  it('getCardImageLoadingAttrs should prioritize first cards and lazy-load others', () => {
    expect(getCardImageLoadingAttrs(0)).toEqual({ loading: 'eager', fetchpriority: 'high' });
    expect(getCardImageLoadingAttrs(1)).toEqual({ loading: 'eager', fetchpriority: 'high' });
    expect(getCardImageLoadingAttrs(2)).toEqual({ loading: 'lazy', fetchpriority: 'auto' });
  });

  it('buildRecipeCardAccessibleName should include the exact visible recipe title', () => {
    expect(buildRecipeCardAccessibleName('Frango Xadrez')).toBe('Frango Xadrez');
    expect(buildRecipeCardAccessibleName('  Purê de Batata  ')).toBe('Purê de Batata');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/logic/performance-guards.test.js`
Expected: FAIL with module/function not found.

- [ ] **Step 3: Write minimal implementation**

```js
export function getCardImageLoadingAttrs(index) {
  const prioritized = index < 2;
  return {
    loading: prioritized ? 'eager' : 'lazy',
    fetchpriority: prioritized ? 'high' : 'auto'
  };
}

export function buildRecipeCardAccessibleName(title) {
  return String(title || '').trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/logic/performance-guards.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/logic/performance-guards.js src/logic/performance-guards.test.js
git commit -m "test(perf): add guards for card image and accessible name"
```

### Task 2: Isolar build publico/admin para evitar CSS cruzado na home

**Files:**
- Modify: `vite.config.js`
- Test: `npm run build`

- [ ] **Step 1: Write the failing build assertion (manual, reproducible)**

```bash
npm run build
rg "assets/admin-.*\\.css" dist/index.html -n
```

Expected: command finds an admin CSS reference in `dist/index.html` (current failing behavior).

- [ ] **Step 2: Adjust build configuration to keep each HTML entry with its own CSS injection path**

```js
build: {
  cssCodeSplit: true,
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      admin: resolve(__dirname, 'admin.html')
    },
    output: {
      manualChunks(id) {
        if (id.includes('src/admin.js')) return 'admin';
      }
    }
  }
}
```

- [ ] **Step 3: Re-run build and verify no admin CSS reference in home output**

```bash
npm run build
rg "assets/admin-.*\\.css" dist/index.html -n
```

Expected: no matches in `dist/index.html`.

- [ ] **Step 4: Quick smoke check admin output still loads styles**

```bash
rg "stylesheet" dist/admin.html -n
```

Expected: at least one CSS asset reference exists in `dist/admin.html`.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js
git commit -m "perf(build): isolate public and admin css outputs"
```

### Task 3: Implementar carregamento em duas fases (lista inicial + detalhes sob demanda)

**Files:**
- Create: `src/api/recipes-loader.js`
- Create: `src/api/recipes-loader.test.js`
- Modify: `src/main.js`
- Modify: `src/modules/recipe-modal.js`
- Test: `src/api/recipes-loader.test.js`

- [ ] **Step 1: Write failing unit tests for phased loading contracts**

```js
import { describe, it, expect, vi } from 'vitest';
import {
  mapSummaryRecipes,
  buildRecipeDetailsIndex
} from './recipes-loader.js';

describe('API: Recipes Loader', () => {
  it('mapSummaryRecipes should keep only summary fields required for grid render', () => {
    const rows = [{ id: 1, title: 'A', category_id: 2, emoji: '🍲', image: '1.png', servings: 2, tips: 'x', extra: 'drop' }];
    const result = mapSummaryRecipes(rows);
    expect(result[0]).toEqual({ id: 1, title: 'A', category_id: 2, category: undefined, emoji: '🍲', image: '1.png', servings: 2, tips: 'x' });
  });

  it('buildRecipeDetailsIndex should group ingredients and steps by recipe id', () => {
    const details = buildRecipeDetailsIndex(
      [{ receita_id: 1, name: 'Sal', qty: 1, unit: 'colher' }],
      [{ receita_id: 1, step_text: 'Misture' }]
    );
    expect(details[1].ingredients).toHaveLength(1);
    expect(details[1].steps).toEqual(['Misture']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/recipes-loader.test.js`
Expected: FAIL (module/functions missing).

- [ ] **Step 3: Implement minimal loader helpers**

```js
export function mapSummaryRecipes(rows = []) {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category_id: r.category_id,
    category: r.category,
    emoji: r.emoji,
    image: r.image,
    servings: r.servings,
    tips: r.tips
  }));
}

export function buildRecipeDetailsIndex(ingredientsRows = [], stepsRows = []) {
  const details = {};
  for (const ing of ingredientsRows) {
    details[ing.receita_id] ??= { ingredients: [], steps: [] };
    details[ing.receita_id].ingredients.push({ name: ing.name, qty: ing.qty, unit: ing.unit });
  }
  for (const step of stepsRows) {
    details[step.receita_id] ??= { ingredients: [], steps: [] };
    details[step.receita_id].steps.push(step.step_text);
  }
  return details;
}
```

- [ ] **Step 4: Refactor `src/main.js` to use summary query in bootstrap and details fetch on modal open**

```js
// bootstrap query
supabase.from('receitas').select('id, title, category_id, category, emoji, image, servings, tips')

// details query trigger (on-demand before modal render details)
supabase.from('ingredientes').select('receita_id, name, qty, unit').eq('receita_id', recipeId)
supabase.from('passos').select('receita_id, step_text').eq('receita_id', recipeId).order('ordem')
```

- [ ] **Step 5: Run tests for new loader**

Run: `npm run test -- src/api/recipes-loader.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/api/recipes-loader.js src/api/recipes-loader.test.js src/main.js src/modules/recipe-modal.js
git commit -m "perf(data): split recipe bootstrap into summary and on-demand details"
```

### Task 4: Otimizar cards (imagem responsiva) e corrigir SEO/A11y da home

**Files:**
- Modify: `src/modules/recipes-render.js`
- Modify: `index.html`
- Modify: `src/logic/performance-guards.js`
- Test: `src/logic/performance-guards.test.js`

- [ ] **Step 1: Add failing test for responsive image source set builder**

```js
import { buildRecipeImageSources } from './performance-guards.js';

it('buildRecipeImageSources should return modern formats with png fallback', () => {
  const src = buildRecipeImageSources('10.png');
  expect(src.fallback).toBe('10.png');
  expect(src.webp).toContain('10.webp');
  expect(src.avif).toContain('10.avif');
});
```

- [ ] **Step 2: Run targeted test**

Run: `npm run test -- src/logic/performance-guards.test.js`
Expected: FAIL (new helper missing).

- [ ] **Step 3: Implement helper and integrate in `recipes-render.js` `<picture>` output**

```js
export function buildRecipeImageSources(imagePath = '') {
  const trimmed = String(imagePath).trim();
  const base = trimmed.replace(/\.png$/i, '');
  return {
    fallback: trimmed,
    webp: `${base}.webp`,
    avif: `${base}.avif`
  };
}
```

```html
<picture>
  <source srcset="${img.avif}" type="image/avif" />
  <source srcset="${img.webp}" type="image/webp" />
  <img src="${img.fallback}" ... />
</picture>
```

- [ ] **Step 4: Add meta description and align card accessible name with visible title**

```html
<meta name="description" content="Livro de receitas, planejamento semanal e lista de compras do Chef Digital." />
```

```js
card.setAttribute('aria-label', buildRecipeCardAccessibleName(recipe.title));
```

- [ ] **Step 5: Re-run targeted tests**

Run: `npm run test -- src/logic/performance-guards.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/recipes-render.js src/logic/performance-guards.js src/logic/performance-guards.test.js index.html
git commit -m "perf(ui): optimize card media and fix seo/a11y findings"
```

### Task 5: Validar fim-a-fim e registrar resultados

**Files:**
- Modify: `docs/relatorio_receitas.report.json` (novo run)
- Modify: `docs/relatorio_receitas.report.html` (novo run)

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: no lint errors.

- [ ] **Step 2: Run test suite**

Run: `npm run test`
Expected: all tests PASS.

- [ ] **Step 3: Build production bundle**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Run nova auditoria Lighthouse e comparar metricas-chave**

Run (example):
```bash
# usar o mesmo comando/procedimento ja adotado no projeto para gerar docs/relatorio_receitas.report.*
```

Expected:
- melhor LCP/FCP/SI versus baseline atual
- `meta-description` resolvido
- `label-content-name-mismatch` resolvido

- [ ] **Step 5: Commit validation artifacts**

```bash
git add docs/relatorio_receitas.report.json docs/relatorio_receitas.report.html
git commit -m "chore(report): refresh lighthouse report after performance improvements"
```
