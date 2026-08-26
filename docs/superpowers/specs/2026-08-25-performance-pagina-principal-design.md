# Especificação Técnica: Otimização de Performance da Página Principal

**Documento:** `docs/superpowers/specs/2026-08-25-performance-pagina-principal-design.md`  
**Status:** Proposto / Aguardando Implementação  
**Data:** 2026-08-25  
**Autor:** Antigravity / Chef Digital  
**Referência:** `docs/ROADMAP_v2.md`

---

## 1. Objetivo & Escopo

Otimizar o tempo de carregamento inicial (FCP, LCP e TBT) da página principal do Chef Digital, reduzindo:
1. O tamanho do bundle JavaScript inicial através de code-splitting de componentes pesados (modais e drawers).
2. O payload de rede da query inicial ao Supabase, dividindo a busca em dados leves de listagem vs. dados completos sob demanda.
3. O overhead de parsing/execução no bootstrap da aplicação.

---

## 2. Diagnóstico Atual

| Componente / Fluxo | Comportamento Atual | Impacto |
|---|---|---|
| **Bundle JS (`src/App.jsx`)** | Importação síncrona de `RecipeModal`, `CookingMode`, `PlannerDrawer`, `ShoppingDrawer`, `PantryDrawer`. | Todos os modais/drawers são parseados e executados no carregamento inicial, inflando o bundle JS. |
| **Query Supabase** | `supabase.from('receitas').select(...)` baixa todos os campos, tags, `ingredientes (name, qty, unit, group_name, ordem)` e `passos (step_text, ordem)` de todas as receitas de uma vez. | Payload inicial grande e desnecessário para renderizar apenas os cards do grid. |
| **Imagens de Cards** | Já implementado `getCardImageLoadingAttrs` (lazy loading + fetchpriority) e `PAGE_SIZE = 12` com `IntersectionObserver`. | Bom comportamento no DOM, mas catálogo de imagens original ainda contém PNGs não otimizados. |

---

## 3. Arquitetura da Solução

### 3.1. Code-Splitting de Modais e Drawers (Client-side)

Converter componentes secundários que não aparecem no primeiro paint para `React.lazy()` com fallback leve (`null` ou skeleton):

```jsx
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';

const PlannerDrawer = lazy(() => import('./components/PlannerDrawer.jsx').then(m => ({ default: m.PlannerDrawer })));
const ShoppingDrawer = lazy(() => import('./components/ShoppingDrawer.jsx').then(m => ({ default: m.ShoppingDrawer })));
const PantryDrawer = lazy(() => import('./components/PantryDrawer.jsx').then(m => ({ default: m.PantryDrawer })));
const RecipeModal = lazy(() => import('./components/RecipeModal.jsx').then(m => ({ default: m.RecipeModal })));
const CookingMode = lazy(() => import('./components/CookingMode.jsx').then(m => ({ default: m.CookingMode })));
```

**Condição de Renderização:**
- Envolver os drawers/modais em `<Suspense fallback={null}>`.
- Renderizar condicionalmente apenas quando a flag `isOpen` for verdadeira (ou manter o lazy chunk em prefetch no hover/interação).

---

### 3.2. Query Supabase Rasa (Listagem) vs. Completa (Detalhe)

#### A. Query Inicial de Listagem (Home / Grid)
Carregar apenas metadados necessários para os cards e filtros essenciais:
```javascript
supabase
    .from('receitas')
    .select(`
        id, title, category_id, emoji, image, servings, prep_time, cook_time,
        categorias (id, key, label),
        receita_tags (tags (key)),
        ingredientes (name)
    `)
    .order('title')
```
*Nota*: Mantemos `ingredientes(name)` apenas se a busca instantânea por ingrediente continuar ativa no grid; caso contrário, remove-se até mesmo os nomes dos ingredientes da query inicial.

#### B. Query de Detalhes Sob Demanda (`RecipeModal` / `CookingMode`)
Ao clicar no card para abrir o modal de receita:
1. Checar se a receita já possui `passos` e `ingredientes` completos em cache de memória (`recipeDetailsCache`).
2. Se não possuir, disparar busca dedicada:
```javascript
const { data, error } = await supabase
    .from('receitas')
    .select(`
        id, tips, source_url, author,
        ingredientes (name, qty, unit, group_name, ordem),
        passos (step_text, ordem)
    `)
    .eq('id', recipeId)
    .single();
```
3. Mesclar dados no estado local / cache de receitas.

---

## 4. Plano de Testes & Verificação

1. **Testes Unitários e de Integração**:
   - Rodar `npm test` garantindo que testes existentes (`RecipesGrid.test.jsx`, `RecipeCard.test.jsx`, `RecipeModal.test.jsx`, etc.) continuam passando.
   - Criar teste para o carregamento assíncrono / lazy dos modais e do cache de detalhes.
2. **Build de Produção & Verificação de Chunks**:
   - Rodar `npm run build`.
   - Verificar se `main.js` teve tamanho reduzido e se chunks separados (`RecipeModal-*.js`, `PlannerDrawer-*.js`, etc.) foram gerados em `dist/assets/`.
3. **Validação de Performance (Lighthouse / DevTools)**:
   - Medir FCP, LCP e Total Blocking Time antes e depois da refatoração.

---

## 5. Critérios de Aceite

- [ ] Redução mensurável no tamanho do bundle JS inicial da página principal.
- [ ] Modais e Drawers carregados assincronamente sem travamentos visuais.
- [ ] Dados detalhados de ingredientes e passos carregados sob demanda com cache reativo.
- [ ] Todos os testes automatizados do Vitest passando com sucesso.
