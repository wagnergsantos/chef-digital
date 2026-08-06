# Chef Digital — Copilot Instructions

## What this is
A single-page, progressive web app (PWA) recipe book, weekly meal planner, and shopping list application (pt-BR) built with modern ESM structure, Vite, IndexedDB, and Supabase integration.

## Architecture
The project follows the **Unified Architecture** (`api/` ↔ `logic/` ↔ `cache/` ↔ `components/`):

- `src/api/` — External I/O (Supabase client and RPC integrations).
- `src/logic/` — Pure business logic functions (search matching, text normalization, pantry checks, portion scaling). Pure and unit-tested with Vitest.
- `src/cache/` — Local persistence (IndexedDB `ChefDigitalDB`, `localStorage` safely wrapped, service worker PWA sync).
- `src/modules/` — UI modules and event handlers (recipes rendering, theme management, state management).
- `estilos.css` — Vanilla CSS with design system custom properties in `:root`. Dark mode via `[data-theme="dark"]`.
- `main.js` — App entry point orchestrating state, dependencies, and window exports for HTML handlers.

## Testing & Linting
- **Tests**: Vitest (`npm run test`)
- **Lint**: Oxlint (`npm run lint`)
- **Build**: Vite (`npm run build`)

## State & Data Persistence
- Core application state is centralized in `src/modules/state.js`.
- Local storage keys are namespaced: `chef_digital_theme`, `chef_digital_favorites`, `chef_digital_planned`, `chef_digital_shopping`, `chef_digital_pantry`.
- Primary recipe data and categories load offline-first from IndexedDB cache, falling back/syncing with Supabase backend.

## Performance & Accessibility Guidelines (Lighthouse 100/100)
- **Core Web Vitals**: Maintain FCP ≤ 1.5s, LCP ≤ 1.5s, TBT ≤ 100ms, and CLS ≤ 0.05. Avoid layout thrashing, forced reflows, or DOM mutations inside tight loops/scroll events.
- **Accessibility (A11y)**: Every interactive element (buttons, icon triggers, custom inputs) MUST have a valid `aria-label` or explicit text label. Maintain strict heading hierarchy (`<h1>` down to `<h6>`) and HTML5 semantic elements.
- **Visuals & CSS**: Use Vanilla CSS custom properties (`:root`). Ensure explicit `width`/`height` or aspect-ratio on images/SVGs to prevent CLS.
- **Zero Console Errors**: Ensure no unhandled exceptions or warnings are produced in browser runtime.

## Execution & Fast Track Guidelines
- **Fast Track (Simple/Focused Tasks)**: For changes affecting 1–3 files, small bugfixes, CSS/visual tweaks, or simple parameters:
  - Do NOT spawn subagents or setup heavy multi-role review pipelines.
  - Edit files directly in the active working branch.
  - Run tests (`npm run test`) and report results concisely.
- **Complex / Multi-system Tasks**: For full API integrations, major architectural refactors, or new multi-file modules, prepare a spec/plan and use structured execution workflows.
- **Communication**: Prioritize direct edits and swift feedback without unnecessary confirmation loops.

## Conventions
- Keep business logic in `src/logic/` as pure functions without DOM or `window` dependencies.
- Follow `DESIGN.md` for visual guidelines, `PRODUCT.md` for product principles, and `.agents/fast-track.md` for task workflow rules.
- Always run `npm run test` and `npm run lint` before committing structural changes.


