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

## Conventions
- Keep business logic in `src/logic/` as pure functions without DOM or `window` dependencies.
- Follow `DESIGN.md` for visual guidelines and `PRODUCT.md` for product principles.
- Always run `npm run test` and `npm run lint` before committing structural changes.
