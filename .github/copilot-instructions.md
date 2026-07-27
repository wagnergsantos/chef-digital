# Chef Digital — Copilot Instructions

## What this is
A single-page, no-build, static recipe book / weekly meal planner / shopping-list app
(pt-BR). Pure HTML/CSS/JS — no bundler, no package.json, no npm install, no test suite.
Opening `index.html` directly (or via a static file server) is the entire "build".

## Architecture (read these three files together)
- `receitas.js` — **data only**. Defines `const receitasData = { categories, recipes }`.
  Each recipe: `{ id, title, category (string|string[]), source, emoji, image, ingredients
  [{name, qty, unit}], steps[], tips }`. See the JSDoc block at the top of the file for the
  full schema and the "prompt for AI" used to convert raw recipe text into this JSON shape.
- `index.html` — **all application logic**, inline in a single `<script>` block near the
  bottom of the file (functions like `renderRecipes`, `renderPlanner`,
  `generateConsolidatedShoppingList`, `openRecipeModal`, etc.). `window.onload` copies
  `receitasData.categories`/`.recipes` into the module-level `categories`/`recipes` state
  variables — the data file is never mutated at runtime.
- `estilos.css` — vanilla CSS using custom properties defined in `:root` (colors, spacing,
  `--radius-*`, `--shadow-*`). Dark mode is `[data-theme="dark"]` (also mirrors system
  `prefers-color-scheme: dark` via a `:root:not([data-theme="light"])` block). Theme is
  applied via an inline `<head>` script (before CSS load) to avoid a flash of wrong theme.

State is plain global `let` variables in the inline script (`recipes`, `categories`,
`activeCategory`, `searchQuery`, `favorites`, `shoppingList`, `plannedRecipes`,
`activeRecipePortions`, `activeRecipeId`, `showFavoritesOnly`). Persistence is
`localStorage` only, no backend:
- `chef_digital_theme`, `chef_digital_favorites`, `chef_digital_planned`, `chef_digital_shopping`

Rendering is manual DOM manipulation (`document.createElement`, template strings into
`innerHTML`) — there is no framework/virtual DOM. Buttons wire up via inline
`onclick`/`onkeyup`/`onkeydown` attributes in the HTML, calling the global functions
defined in the script.

## Data-maintenance scripts (`scripts/`, run with `python`, no deps beyond stdlib)
These all parse `receitas.js` by locating the `const receitasData =` token, extracting the
JSON between the first `{` and the last `}`, and (for writers) re-serializing with
`json.dumps(data, indent=4, ensure_ascii=False)` back into the same file — preserve this
convention if you edit `receitas.js` programmatically instead of by hand.
- `generate_id_receitas.py` — dumps `id - title` lines to `scripts/id_receitas.txt`.
- `remove_recipes_by_txt.py` — reads IDs from `scripts/id_receitas.txt`, deletes those
  recipes from `receitas.js`, then empties the txt file.
- `update_images.py` — for each recipe id, sets `recipe.image` to `"<id>.png"` if that file
  exists at the repo root, else `null`; also strips resolved ids out of `id_receitas.txt`.
- `generate_csv.py` — exports `id, titulo, ingrediente, categorias` to `scripts/receitas.csv`
  (semicolon-delimited, quoted) for spreadsheet review.
- Recipe photos live at the repo root as `<id>.png` (matching each recipe's numeric `id`).

## Conventions
- New/edited recipe categories must use the existing lowercase keys declared in
  `receitasData.categories` (e.g. `almoco`, `janta`, `bife`, `arroz`...) — don't invent new
  keys without adding them to that map first. `category` accepts a string or string array.
- `ingredients[].qty` is a number or `null` (never a string like `"500g"`); the unit always
  goes in `unit`, including sentinel units like `"a gosto"`/`"opcional"`.
- Follow `DESIGN.md` for visual/design-system changes (colors, type scale, radii, shadow
  usage, do's/don'ts — e.g. amber is reserved for brand/active states and must stay under
  ~10% of any screen) and `PRODUCT.md` for product intent/audience/accessibility bar
  (WCAG AA 4.5:1 contrast, respect `prefers-reduced-motion`, mobile/tablet-first for kitchen use).
- UI copy and comments are in Portuguese (pt-BR); keep new copy consistent with that.
- Design/feature specs and plans (when present) live under `docs/superpowers/specs/` and
  `docs/superpowers/plans/` — check there for prior design decisions before large UI changes.

## Verifying changes
There is no automated test/build/lint pipeline. Verify changes by opening `index.html` in a
browser (a local static server avoids any `file://` quirks) and manually exercising the
affected flow (search/filter, favorites, weekly planner, shopping list consolidation, recipe
modal). If you touch `receitas.js`, confirm it still parses as valid JSON after the
`const receitasData =` prefix (e.g. `python -c "import re,json; ..."` or run the relevant
`scripts/*.py` file, which will error loudly if the JSON is malformed).
